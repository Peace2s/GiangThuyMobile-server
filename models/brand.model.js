const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('brand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true,
  tableName: 'brands'
});

module.exports = Brand; 