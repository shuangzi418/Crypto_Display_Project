const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function verifyTestDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await connection.end();
  } catch (error) {
    console.error('MySQL test database is unavailable. Please start MySQL first, for example with `docker compose up -d mysql`.');
    console.error(`Connection target: ${(process.env.DB_HOST || '127.0.0.1')}:${process.env.DB_PORT || 3306}`);
    process.exit(1);
  }
}

verifyTestDatabase();
