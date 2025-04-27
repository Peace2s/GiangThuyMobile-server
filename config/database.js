require('dotenv').config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || "phone_shop",
  process.env.MYSQLUSER || "root",
  process.env.MYSQLPASSWORD || "",
  {
    host: process.env.MYSQLHOST || "localhost",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize; 