const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.products = require("./product.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);
db.carts = require("./cart.model.js");
db.cartItems = require("./cartItem.model.js");
db.orders = require("./order.model.js");
db.orderItems = require("./orderItem.model.js");

// Define relationships
// User - Cart (One-to-Many)
db.users.hasMany(db.carts, { foreignKey: 'userId' });
db.carts.belongsTo(db.users, { foreignKey: 'userId' });

// Cart - CartItem (One-to-Many)
db.carts.hasMany(db.cartItems, { foreignKey: 'cartId' });
db.cartItems.belongsTo(db.carts, { foreignKey: 'cartId' });

// Product - CartItem (One-to-Many)
db.products.hasMany(db.cartItems, { foreignKey: 'productId' });
db.cartItems.belongsTo(db.products, { foreignKey: 'productId' });

// User - Order (One-to-Many)
db.users.hasMany(db.orders, { foreignKey: 'userId' });
db.orders.belongsTo(db.users, { foreignKey: 'userId' });

// Order - OrderItem (One-to-Many)
db.orders.hasMany(db.orderItems, { foreignKey: 'orderId' });
db.orderItems.belongsTo(db.orders, { foreignKey: 'orderId' });

// Product - OrderItem (One-to-Many)
db.products.hasMany(db.orderItems, { foreignKey: 'productId' });
db.orderItems.belongsTo(db.products, { foreignKey: 'productId' });

module.exports = db;