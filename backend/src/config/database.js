const path = require('path');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const dialect = process.env.DB_DIALECT || 'mysql';
const commonOptions = {
  dialect,
  logging: false,
  define: {
    freezeTableName: true
  }
};

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, commonOptions);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'crypto_quiz',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      ...commonOptions,
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306)
    }
  );
}

module.exports = sequelize;
