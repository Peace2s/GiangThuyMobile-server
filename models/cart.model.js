const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'checkout', 'abandoned'),
    defaultValue: 'active'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  }
}, {
  tableName: 'Carts',
  timestamps: true
});

module.exports = Cart; 