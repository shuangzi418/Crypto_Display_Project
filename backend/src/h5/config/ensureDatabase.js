const mysql = require('mysql2/promise');

const escapeIdentifier = (value) => String(value).replace(/`/g, '``');
const escapeString = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const ensureH5Database = async () => {
  const dialect = process.env.H5_DB_DIALECT || process.env.DB_DIALECT || 'mysql';

  if (dialect !== 'mysql' || process.env.H5_DATABASE_URL) {
    return;
  }

  const adminUser = process.env.H5_DB_ADMIN_USER || process.env.DB_USER || 'root';
  const adminPassword = process.env.H5_DB_ADMIN_PASSWORD !== undefined
    ? process.env.H5_DB_ADMIN_PASSWORD
    : (process.env.DB_PASSWORD || '');
  const databaseName = process.env.H5_DB_NAME || 'crypto_quiz_h5';
  const applicationUser = process.env.H5_DB_USER || adminUser;
  const applicationPassword = process.env.H5_DB_PASSWORD !== undefined
    ? process.env.H5_DB_PASSWORD
    : adminPassword;

  const connection = await mysql.createConnection({
    host: process.env.H5_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.H5_DB_PORT || process.env.DB_PORT || 3306),
    user: adminUser,
    password: adminPassword
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${escapeIdentifier(databaseName)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    if (applicationUser && applicationUser !== adminUser) {
      const quotedUser = `'${escapeString(applicationUser)}'@'%'`;
      const quotedPassword = `'${escapeString(applicationPassword || '')}'`;
      await connection.query(`CREATE USER IF NOT EXISTS ${quotedUser} IDENTIFIED BY ${quotedPassword}`);
      await connection.query(`ALTER USER ${quotedUser} IDENTIFIED BY ${quotedPassword}`);
      await connection.query(
        `GRANT ALL PRIVILEGES ON \`${escapeIdentifier(databaseName)}\`.* TO ${quotedUser}`
      );
      await connection.query('FLUSH PRIVILEGES');
    }
  } finally {
    await connection.end();
  }
};

module.exports = {
  ensureH5Database
};
