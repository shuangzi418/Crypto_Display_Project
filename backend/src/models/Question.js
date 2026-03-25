const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./BaseModel');

class Question extends BaseModel {}

Question.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('options');

      if (!rawValue) {
        return [];
      }

      try {
        return JSON.parse(rawValue);
      } catch (error) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(Array.isArray(value) ? value : []));
    }
  },
  correctAnswer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Question',
  tableName: 'questions',
  timestamps: false
});

module.exports = Question;
