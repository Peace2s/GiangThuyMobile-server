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
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'brands',
      key: 'id'
    }
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
  camera: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Thông tin camera (độ phân giải, tính năng)'
  },
  battery: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ram: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Dung lượng RAM'
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL hình ảnh sản phẩm từ Cloudinary'
  }
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;