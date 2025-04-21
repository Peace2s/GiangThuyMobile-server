const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'checkout', 'abandoned'),
    defaultValue: 'active'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 0),
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Cart; 