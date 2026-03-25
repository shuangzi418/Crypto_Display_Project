const mysql = require('mysql2/promise');

const ensureDatabase = async () => {
  const dialect = process.env.DB_DIALECT || 'mysql';

  if (dialect !== 'mysql' || process.env.DATABASE_URL) {
    return;
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const databaseName = process.env.DB_NAME || 'crypto_quiz';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
};

module.exports = {
  ensureDatabase
};
