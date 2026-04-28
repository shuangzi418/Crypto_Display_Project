const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const h5Sequelize = require('../h5/config/database');

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

const ensureQuestionExplanationColumn = async (queryInterface) => {
  const questionTable = await queryInterface.describeTable('questions');

  if (questionTable.explanation) {
    return;
  }

  await queryInterface.addColumn('questions', 'explanation', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null
  });
};

const ensureH5UserPhoneColumn = async (queryInterface) => {
  const h5UserTable = await queryInterface.describeTable('h5_users');

  if (!h5UserTable.phone) {
    return;
  }

  if (h5UserTable.phone.allowNull) {
    return;
  }

  await queryInterface.changeColumn('h5_users', 'phone', {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    defaultValue: null
  });
};

const ensureSchemaCompatibility = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const h5QueryInterface = h5Sequelize.getQueryInterface();

  await ensureAvatarColumn(queryInterface);
  await ensureSubmissionCompetitionColumn(queryInterface);
  await ensureQuestionExplanationColumn(queryInterface);
  await ensureH5UserPhoneColumn(h5QueryInterface);
};

module.exports = {
  ensureSchemaCompatibility
};
