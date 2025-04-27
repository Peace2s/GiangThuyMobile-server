const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cart = require('./cart.model');
const Product = require('./product.model');
const ProductVariant = require('./productVariant.model');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cart,
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
    defaultValue: 1,
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
  tableName: 'cart_items'
});

module.exports = CartItem; 