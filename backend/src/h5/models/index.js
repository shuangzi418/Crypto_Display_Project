const h5Sequelize = require('../config/database');
const H5User = require('./H5User');
const H5ChallengeAttempt = require('./H5ChallengeAttempt');

H5User.hasMany(H5ChallengeAttempt, {
  foreignKey: 'userId',
  as: 'challengeAttempts'
});

H5ChallengeAttempt.belongsTo(H5User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  h5Sequelize,
  H5User,
  H5ChallengeAttempt
};
