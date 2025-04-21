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
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false
      },
      discount_price: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: true
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('in_stock', 'out_of_stock', 'discontinued'),
        allowNull: false,
        defaultValue: 'in_stock'
      },
      brand: {
        type: Sequelize.STRING(100)
      },
      storage: {
        type: Sequelize.STRING(50)
      },
      screen: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Thông tin màn hình (kích thước, độ phân giải, công nghệ)'
      },
      processor: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Thông tin vi xử lý (chip, tốc độ)'
      },
      ram: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Dung lượng RAM'
      },
      camera: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Thông tin camera (độ phân giải, tính năng)'
      },
      battery: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      }
    }, {
      timestamps: true,
      tableName: 'products'
    });
  
    return Product;
  };