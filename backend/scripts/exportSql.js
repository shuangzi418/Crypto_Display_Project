const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const TABLE_GROUPS = [
  {
    fileName: 'users.sql',
    label: 'users',
    tables: ['users']
  },
  {
    fileName: 'questions.sql',
    label: 'questions',
    tables: ['questions']
  },
  {
    fileName: 'app_data.sql',
    label: 'app_data',
    tables: ['competitions', 'competition_questions', 'competition_participants', 'messages', 'submissions']
  }
];

const escapeIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const getOutputDir = () => {
  const customPath = process.argv[2];

  if (customPath) {
    return path.resolve(process.cwd(), customPath);
  }

  return path.resolve(__dirname, '..', 'sql');
};

const getConnectionConfig = (withDatabase = true) => ({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: withDatabase ? (process.env.DB_NAME || 'crypto_quiz') : undefined,
  multipleStatements: true
});

const buildFileHeader = (databaseName, label) => {
  return [
    `-- ${label}`,
    `-- Exported at ${new Date().toISOString()}`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS=0;',
    `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE ${escapeIdentifier(databaseName)};`,
    ''
  ].join('\n');
};

const buildFileFooter = () => 'SET FOREIGN_KEY_CHECKS=1;\n';

async function getTableNames(connection) {
  const [tableRows] = await connection.query('SHOW TABLES');
  const tableKey = tableRows[0] ? Object.keys(tableRows[0])[0] : null;
  return tableKey ? tableRows.map((row) => row[tableKey]) : [];
}

async function getCreateTableSql(connection, tableName) {
  const [createRows] = await connection.query(`SHOW CREATE TABLE ${escapeIdentifier(tableName)}`);
  return createRows[0]['Create Table'];
}

async function getInsertSql(connection, tableName) {
  const [rows] = await connection.query(`SELECT * FROM ${escapeIdentifier(tableName)}`);

  if (!rows.length) {
    return '';
  }

  const columns = Object.keys(rows[0]);
  const columnSql = columns.map(escapeIdentifier).join(', ');
  const valuesSql = rows
    .map((row) => `(${columns.map((column) => mysql.escape(row[column])).join(', ')})`)
    .join(',\n');

  return `INSERT INTO ${escapeIdentifier(tableName)} (${columnSql}) VALUES\n${valuesSql};\n\n`;
}

async function buildSchemaSql(connection, databaseName, tableNames) {
  let sql = buildFileHeader(databaseName, 'schema.sql');

  for (const tableName of tableNames) {
    const createSql = await getCreateTableSql(connection, tableName);
    sql += `DROP TABLE IF EXISTS ${escapeIdentifier(tableName)};\n`;
    sql += `${createSql};\n\n`;
  }

  sql += buildFileFooter();
  return sql;
}

async function buildGroupSql(connection, databaseName, group) {
  let sql = buildFileHeader(databaseName, group.fileName);

  for (const tableName of group.tables) {
    sql += await getInsertSql(connection, tableName);
  }

  sql += buildFileFooter();
  return sql;
}

async function buildFullSql(connection, databaseName, tableNames) {
  let sql = buildFileHeader(databaseName, `${databaseName}.sql`);

  for (const tableName of tableNames) {
    const createSql = await getCreateTableSql(connection, tableName);
    sql += `DROP TABLE IF EXISTS ${escapeIdentifier(tableName)};\n`;
    sql += `${createSql};\n\n`;
  }

  for (const tableName of tableNames) {
    sql += await getInsertSql(connection, tableName);
  }

  sql += buildFileFooter();
  return sql;
}

async function exportSql() {
  const databaseName = process.env.DB_NAME || 'crypto_quiz';
  const outputDir = getOutputDir();
  const rootConnection = await mysql.createConnection(getConnectionConfig(false));

  try {
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await rootConnection.end();
  }

  const connection = await mysql.createConnection(getConnectionConfig(true));

  try {
    const tableNames = await getTableNames(connection);
    const fullFileName = `${databaseName}.sql`;

    fs.mkdirSync(outputDir, { recursive: true });

    const schemaSql = await buildSchemaSql(connection, databaseName, tableNames);
    fs.writeFileSync(path.join(outputDir, 'schema.sql'), schemaSql, 'utf8');

    for (const group of TABLE_GROUPS) {
      const groupSql = await buildGroupSql(connection, databaseName, group);
      fs.writeFileSync(path.join(outputDir, group.fileName), groupSql, 'utf8');
    }

    const fullSql = await buildFullSql(connection, databaseName, tableNames);
    fs.writeFileSync(path.join(outputDir, fullFileName), fullSql, 'utf8');

    const manifest = {
      database: databaseName,
      generatedAt: new Date().toISOString(),
      files: [
        { fileName: 'schema.sql', label: 'schema', tables: tableNames },
        ...TABLE_GROUPS,
        { fileName: fullFileName, label: 'full', tables: tableNames }
      ]
    };

    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log(`SQL dumps exported to ${outputDir}`);
    console.log(`- schema.sql`);
    TABLE_GROUPS.forEach((group) => console.log(`- ${group.fileName}`));
    console.log(`- ${fullFileName}`);
    console.log(`- manifest.json`);
  } finally {
    await connection.end();
  }
}

exportSql().catch((error) => {
  console.error(`Failed to export SQL dump: ${error.message}`);
  process.exit(1);
});
