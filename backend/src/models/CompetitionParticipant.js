const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./BaseModel');

class CompetitionParticipant extends BaseModel {}

CompetitionParticipant.init({
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'CompetitionParticipant',
  tableName: 'competition_participants',
  timestamps: false
});

module.exports = CompetitionParticipant;
