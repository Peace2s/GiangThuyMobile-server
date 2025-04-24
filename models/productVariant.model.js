const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./product.model');

const ProductVariant = sequelize.define('productVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  storage: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock'),
    allowNull: false,
    defaultValue: 'in_stock'
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL hình ảnh biến thể sản phẩm từ Cloudinary'
  }
}, {
  timestamps: true,
  tableName: 'product_variants',
  hooks: {
    beforeSave: async (variant) => {
      // Tự động cập nhật trạng thái dựa trên số lượng tồn kho
      if (variant.stock_quantity <= 0) {
        variant.status = 'out_of_stock';
      } else if (variant.status === 'out_of_stock') {
        variant.status = 'in_stock';
      }
    }
  }
});

module.exports = ProductVariant; 