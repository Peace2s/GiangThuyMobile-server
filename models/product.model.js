module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define("product", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      discount_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('in_stock', 'out_of_stock'),
        defaultValue: 'in_stock'
      },
      category: {
        type: Sequelize.ENUM('phone', 'accessory'),
        allowNull: false,
        defaultValue: 'phone'
      },
      brand: {
        type: Sequelize.STRING(100)
      },
      storage: {
        type: Sequelize.STRING(50)
      }
    });
  
    return Product;
  };