const path = require('path');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const dialect = process.env.H5_DB_DIALECT || process.env.DB_DIALECT || 'mysql';
const commonOptions = {
  dialect,
  logging: false,
  define: {
    freezeTableName: true
  }
};

let h5Sequelize;

if (process.env.H5_DATABASE_URL) {
  h5Sequelize = new Sequelize(process.env.H5_DATABASE_URL, commonOptions);
} else {
  h5Sequelize = new Sequelize(
    process.env.H5_DB_NAME || 'crypto_quiz_h5',
    process.env.H5_DB_USER || process.env.DB_USER || 'root',
    process.env.H5_DB_PASSWORD || process.env.DB_PASSWORD || '',
    {
      ...commonOptions,
      host: process.env.H5_DB_HOST || process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.H5_DB_PORT || process.env.DB_PORT || 3306)
    }
  );
}

module.exports = h5Sequelize;
