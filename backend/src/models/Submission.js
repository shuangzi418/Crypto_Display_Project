const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./BaseModel');

class Submission extends BaseModel {}

Submission.init({
  answer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  competitionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Submission',
  tableName: 'submissions',
  timestamps: false
});

module.exports = Submission;
