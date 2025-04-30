const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./order.model');
const Product = require('./product.model');
const ProductVariant = require('./productVariant.model');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  variantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ProductVariant,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'order_items'
});

module.exports = OrderItem; 