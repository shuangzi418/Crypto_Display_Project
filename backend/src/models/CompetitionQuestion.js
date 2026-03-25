const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./BaseModel');

class CompetitionQuestion extends BaseModel {}

CompetitionQuestion.init({
  questionOrder: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'CompetitionQuestion',
  tableName: 'competition_questions',
  timestamps: false
});

module.exports = CompetitionQuestion;
