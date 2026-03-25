const { sequelize } = require('../src/models');

module.exports = async () => {
  await sequelize.close();
  console.log('Database connection closed');
};
