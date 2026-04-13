const { DataTypes } = require('sequelize');
const BaseModel = require('../../models/BaseModel');
const h5Sequelize = require('../config/database');

class H5User extends BaseModel {}

H5User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 30]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: h5Sequelize,
  modelName: 'H5User',
  tableName: 'h5_users',
  timestamps: false
});

module.exports = H5User;
