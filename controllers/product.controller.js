const db = require("../models");
const Product = db.products;
const { Op } = require("sequelize");
const cloudinary = require('../config/cloudinary.config');

exports.create = async (req, res) => {
  try {
    const product = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      promotional_price: req.body.promotional_price,
      stock_quantity: req.body.stock_quantity,
      status: req.body.status || 'in_stock',
      category: req.body.category,
      brand: req.body.brand,
      memory: req.body.memory,
      screen: req.body.screen,
      processor: req.body.processor,
      ram: req.body.ram,
      camera: req.body.camera,
      battery: req.body.battery,
      image: req.body.image
    };

    const data = await Product.create(product);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Product."
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice } = req.query;
    let condition = {};

    if (category) {
      condition.category = category;
    }

    if (brand) {
      condition.brand = brand;
    }

    if (minPrice || maxPrice) {
      condition.price = {};
      if (minPrice) condition.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) condition.price[Op.lte] = parseFloat(maxPrice);
    }

    const products = await Product.findAll({
      where: condition,
      order: [['createdAt', 'DESC']]
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Có lỗi xảy ra khi lấy danh sách sản phẩm."
    });
  }
};

exports.findByCategory = async (req, res) => {
  const { category } = req.params;
  
  try {
    const products = await Product.findAll({
      where: { category: category }
    });
    
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: `Lỗi khi lấy sản phẩm theo category=${category}`
    });
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;
  
  try {
    const product = await Product.findByPk(id);
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({
        message: `Không tìm thấy sản phẩm với id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Lỗi khi lấy sản phẩm với id=" + id
    });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.update({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discount_price: req.body.discount_price,
      stock_quantity: req.body.stock_quantity,
      status: req.body.status,
      category: req.body.category,
      brand: req.body.brand,
      storage: req.body.storage,
      screen: req.body.screen,
      processor: req.body.processor,
      ram: req.body.ram,
      camera: req.body.camera,
      battery: req.body.battery
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Product.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "Sản phẩm đã được xóa thành công!"
      });
    } else {
      res.send({
        message: `Không thể xóa sản phẩm với id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Không thể xóa sản phẩm với id=" + id
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'in_stock',
        discount_price: {
          [Op.ne]: null
        }
      },
      order: [
        ['discount_price', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: 3
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving featured products."
    });
  }
};

// Get new products
exports.getNewProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'in_stock'
      },
      order: [
        ['createdAt', 'DESC']
      ],
      limit: 3
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving new products."
    });
  }
};

// Get products by brand
exports.getProductsByBrand = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        brand: req.params.brand,
        status: 'in_stock'
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload product image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
      resource_type: 'auto'
    });

    res.status(200).send({
      message: 'Image uploaded successfully',
      url: result.secure_url
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Some error occurred while uploading the image.'
    });
  }
};