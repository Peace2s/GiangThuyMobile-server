const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  discount_price: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'discontinued'),
    allowNull: false,
    defaultValue: 'in_stock'
  },
  brand: {
    type: DataTypes.STRING(100)
  },
  storage: {
    type: DataTypes.STRING(50)
  },
  screen: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Thông tin màn hình (kích thước, độ phân giải, công nghệ)'
  },
  processor: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Thông tin vi xử lý (chip, tốc độ)'
  },
  ram: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Dung lượng RAM'
  },
  camera: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Thông tin camera (độ phân giải, tính năng)'
  },
  battery: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;