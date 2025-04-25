const db = require("../models");
const Product = db.products;
const ProductVariant = db.productVariants;
const { Op } = require("sequelize");
const cloudinary = require('../config/cloudinary.config');

exports.create = async (req, res) => {
  try {
    const product = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discount_price: req.body.discount_price,
      stock_quantity: req.body.stock_quantity,
      status: req.body.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
      brand: req.body.brand,
      storage: req.body.storage,
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
      message: err.message || "Có lỗi xảy ra khi tạo sản phẩm."
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

    const products = await Product.findAll({
      where: condition,
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock',
          ...(minPrice !== undefined || maxPrice !== undefined ? {
            [Op.or]: [
              {
                discount_price: {
                  ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                  ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
                }
              },
              {
                [Op.and]: [
                  { discount_price: null },
                  {
                    price: {
                      ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                      ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
                    }
                  }
                ]
              }
            ]
          } : {})
        }
      }],
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
    const product = await Product.findByPk(id, {
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock'
        }
      }]
    });
    
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
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discount_price: req.body.discount_price,
      stock_quantity: req.body.stock_quantity,
      brand: req.body.brand,
      storage: req.body.storage,
      screen: req.body.screen,
      processor: req.body.processor,
      ram: req.body.ram,
      camera: req.body.camera,
      battery: req.body.battery,
      image: req.body.image
    };

    await product.update(updateData);
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

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock'
        }
      }]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock'
        }
      }]
    });

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock',
          discount_price: {
            [Op.ne]: null
          }
        },
        order: [
          ['discount_price', 'ASC']
        ]
      }],
      limit: 3
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Có lỗi xảy ra khi lấy sản phẩm nổi bật."
    });
  }
};

exports.getNewProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: ProductVariant,
        where: {
          status: 'in_stock'
        }
      }],
      order: [
        ['createdAt', 'DESC']
      ],
      limit: 3
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Có lỗi xảy ra khi lấy sản phẩm mới."
    });
  }
};

exports.getProductsByBrand = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;
    const brand = req.params.brand;

    const whereCondition = {
      brand: brand
    };

    const includeCondition = [{
      model: ProductVariant,
      where: {
        status: 'in_stock',
        ...(minPrice !== undefined || maxPrice !== undefined ? {
          [Op.or]: [
            {
              discount_price: {
                ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
              }
            },
            {
              [Op.and]: [
                { discount_price: null },
                {
                  price: {
                    ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                    ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
                  }
                }
              ]
            }
          ]
        } : {})
      }
    }];

    const products = await Product.findAll({
      where: whereCondition,
      include: includeCondition
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
      return res.status(400).send({ message: 'Không có file được tải lên' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
      resource_type: 'auto'
    });

    res.status(200).send({
      message: 'Tải ảnh lên thành công',
      url: result.secure_url
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Có lỗi xảy ra khi tải ảnh lên.'
    });
  }
};


exports.searchProducts = async (req, res) => {
  try {
    const { q, minPrice, maxPrice, brand } = req.query;
    let condition = {};

    if (q) {
      condition[Op.or] = [
        {
          name: {
            [Op.like]: `%${q}%`
          }
        },
        {
          description: {
            [Op.like]: `%${q}%`
          }
        }
      ];
    }

    if (brand) {
      condition.brand = brand;
    }

    const products = await Product.findAll({
      where: condition,
      include: [{
        model: ProductVariant,
        required: false,
        where: {
          status: 'in_stock',
          ...(minPrice !== undefined || maxPrice !== undefined ? {
            [Op.or]: [
              {
                discount_price: {
                  ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                  ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
                }
              },
              {
                [Op.and]: [
                  { discount_price: null },
                  {
                    price: {
                      ...(minPrice && minPrice !== 'null' ? { [Op.gte]: parseFloat(minPrice) } : {}),
                      ...(maxPrice && maxPrice !== 'null' ? { [Op.lte]: parseFloat(maxPrice) } : {})
                    }
                  }
                ]
              }
            ]
          } : {})
        }
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Có lỗi xảy ra khi tìm kiếm sản phẩm."
    });
  }
};