const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const BaseModel = require('./BaseModel');

const hashPassword = async (user) => {
  if (!user.changed('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
};

class User extends BaseModel {
  async matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  toJSON() {
    const plain = super.toJSON();
    delete plain.password;
    return plain;
  }
}

User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  nickname: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  avatarStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  nicknameStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: hashPassword,
    beforeUpdate: hashPassword
  }
});

module.exports = User;
