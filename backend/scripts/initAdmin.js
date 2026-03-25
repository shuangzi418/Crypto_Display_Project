const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');
const { ensureDatabase } = require('../src/config/ensureDatabase');
const { bootstrapAdminUser } = require('../src/services/adminBootstrap');

async function initAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
  }

  await ensureDatabase();
  await sequelize.authenticate();
  await sequelize.sync();
  await bootstrapAdminUser();
  await sequelize.close();
}

initAdmin().catch(async (error) => {
  console.error(error.message);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
