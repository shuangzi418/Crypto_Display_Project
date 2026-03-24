const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const ensureAvatarColumn = async (queryInterface) => {
  const userTable = await queryInterface.describeTable('users');

  if (!userTable.avatar) {
    return;
  }

  const avatarType = String(userTable.avatar.type || '').toLowerCase();

  if (avatarType.includes('longtext')) {
    return;
  }

  await queryInterface.changeColumn('users', 'avatar', {
    type: DataTypes.TEXT('long'),
    allowNull: true
  });
};

const ensureSubmissionCompetitionColumn = async (queryInterface) => {
  const submissionTable = await queryInterface.describeTable('submissions');

  if (submissionTable.competitionId) {
    return;
  }

  await queryInterface.addColumn('submissions', 'competitionId', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  });
};

const ensureSchemaCompatibility = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await ensureAvatarColumn(queryInterface);
  await ensureSubmissionCompetitionColumn(queryInterface);
};

module.exports = {
  ensureSchemaCompatibility
};
