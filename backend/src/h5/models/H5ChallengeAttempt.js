const { DataTypes } = require('sequelize');
const BaseModel = require('../../models/BaseModel');
const h5Sequelize = require('../config/database');

class H5ChallengeAttempt extends BaseModel {}

H5ChallengeAttempt.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  challengeKey: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'national-security'
  },
  correctCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  answeredCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  unansweredCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  },
  medalTier: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'encourage'
  },
  medalTitle: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '继续加油'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: h5Sequelize,
  modelName: 'H5ChallengeAttempt',
  tableName: 'h5_challenge_attempts',
  timestamps: false
});

module.exports = H5ChallengeAttempt;
