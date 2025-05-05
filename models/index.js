const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.products = require('./product.model.js');
db.users = require('./user.model.js');
db.carts = require('./cart.model.js');
db.cartItems = require('./cartItem.model.js');
db.orders = require('./order.model.js');
db.orderItems = require('./orderItem.model.js');
db.productVariants = require('./productVariant.model.js');
db.brands = require('./brand.model.js');

// Define relationships
db.users.hasMany(db.carts, { foreignKey: 'userId' });
db.carts.belongsTo(db.users, { foreignKey: 'userId' });

db.carts.hasMany(db.cartItems, { foreignKey: 'cartId' });
db.cartItems.belongsTo(db.carts, { foreignKey: 'cartId' });

db.products.hasMany(db.cartItems, { foreignKey: 'productId' });
db.cartItems.belongsTo(db.products, { foreignKey: 'productId' });

db.products.hasMany(db.productVariants, { foreignKey: 'productId' });
db.productVariants.belongsTo(db.products, { foreignKey: 'productId' });

db.productVariants.hasMany(db.cartItems, { foreignKey: 'variantId' });
db.cartItems.belongsTo(db.productVariants, { foreignKey: 'variantId' });

db.users.hasMany(db.orders, { foreignKey: 'userId' });
db.orders.belongsTo(db.users, { foreignKey: 'userId' });

db.orders.hasMany(db.orderItems, { foreignKey: 'orderId' });
db.orderItems.belongsTo(db.orders, { foreignKey: 'orderId' });

db.products.hasMany(db.orderItems, { foreignKey: 'productId' });
db.orderItems.belongsTo(db.products, { foreignKey: 'productId' });

db.productVariants.hasMany(db.orderItems, { foreignKey: 'variantId' });
db.orderItems.belongsTo(db.productVariants, { foreignKey: 'variantId' });

db.brands.hasMany(db.products, { foreignKey: 'brandId' });
db.products.belongsTo(db.brands, { foreignKey: 'brandId' });

module.exports = db;