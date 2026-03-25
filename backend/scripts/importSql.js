const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const escapeIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const getDefaultInputPath = () => path.resolve(__dirname, '..', 'sql');

const getRequestedPath = () => {
  const customPath = process.argv[2];

  if (customPath) {
    return path.resolve(process.cwd(), customPath);
  }

  return getDefaultInputPath();
};

const rewriteSqlForTargetDatabase = (rawSql, databaseName) => {
  return rawSql
    .replace(/CREATE DATABASE IF NOT EXISTS\s+`[^`]+`\s+CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;/ig, `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    .replace(/USE\s+`[^`]+`;/ig, `USE ${escapeIdentifier(databaseName)};`);
};

const resolveImportFiles = (inputPath, databaseName) => {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    return [inputPath];
  }

  const manifestPath = path.join(inputPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const orderedFiles = manifest.files
      .filter((entry) => entry.label !== 'full')
      .map((entry) => path.join(inputPath, entry.fileName))
      .filter((filePath) => fs.existsSync(filePath));

    if (orderedFiles.length > 0) {
      return orderedFiles;
    }
  }

  const fallbackFiles = [
    'schema.sql',
    'users.sql',
    'questions.sql',
    'app_data.sql',
    `${databaseName}.sql`
  ]
    .map((fileName) => path.join(inputPath, fileName))
    .filter((filePath) => fs.existsSync(filePath));

  if (fallbackFiles.length === 0) {
    throw new Error(`No SQL files found in ${inputPath}`);
  }

  return fallbackFiles;
};

async function importSql() {
  const databaseName = process.env.DB_NAME || 'crypto_quiz';
  const inputPath = getRequestedPath();

  if (!fs.existsSync(inputPath)) {
    throw new Error(`SQL path not found: ${inputPath}`);
  }

  const filesToImport = resolveImportFiles(inputPath, databaseName);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    for (const filePath of filesToImport) {
      const rawSql = fs.readFileSync(filePath, 'utf8');
      const sql = rewriteSqlForTargetDatabase(rawSql, databaseName);
      await connection.query(sql);
      console.log(`Imported ${filePath}`);
    }
  } finally {
    await connection.end();
  }
}

importSql().catch((error) => {
  console.error(`Failed to import SQL dump: ${error.message}`);
  process.exit(1);
});
