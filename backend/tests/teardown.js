const { sequelize } = require('../src/models');
const { h5Sequelize } = require('../src/h5/models');

module.exports = async () => {
  await sequelize.close();
  await h5Sequelize.close();
  console.log('Database connection closed');
};
