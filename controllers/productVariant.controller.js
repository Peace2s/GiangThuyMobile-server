const db = require("../models");
const ProductVariant = db.productVariants;
const Product = db.products;
const { Op } = require("sequelize");
const cloudinary = require('../config/cloudinary.config');

exports.create = async (req, res) => {
  try {
    const variant = {
      productId: req.body.productId,
      color: req.body.color,
      storage: req.body.storage,
      price: req.body.price,
      discount_price: req.body.discount_price,
      stock_quantity: req.body.stock_quantity,
      status: req.body.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
      image: req.body.image
    };

    const data = await ProductVariant.create(variant);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Có lỗi xảy ra khi tạo phiên bản sản phẩm."
    });
  }
};

exports.findAllByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const variants = await ProductVariant.findAll({
      where: { productId: productId }
    });
    res.send(variants);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Có lỗi xảy ra khi lấy danh sách phiên bản."
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const variant = await ProductVariant.findByPk(id);
    if (variant) {
      res.send(variant);
    } else {
      res.status(404).send({
        message: `Không tìm thấy phiên bản với id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Lỗi khi lấy phiên bản với id=" + id
    });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const variant = await ProductVariant.findByPk(id);
    if (!variant) {
      return res.status(404).json({ message: "Không tìm thấy phiên bản" });
    }

    const updateData = {
      color: req.body.color,
      storage: req.body.storage,
      price: req.body.price,
      discount_price: req.body.discount_price,
      stock_quantity: req.body.stock_quantity,
      status: req.body.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
      image: req.body.image
    };

    await variant.update(updateData);
    res.json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await ProductVariant.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "phiên bản đã được xóa thành công!"
      });
    } else {
      res.send({
        message: `Không thể xóa phiên bản với id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Không thể xóa phiên bản với id=" + id
    });
  }
};

exports.getAvailableVariants = async (req, res) => {
  try {
    const productId = req.params.productId;
    const variants = await ProductVariant.findAll({
      where: {
        productId: productId,
        status: 'in_stock'
      }
    });
    res.send(variants);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Có lỗi xảy ra khi lấy danh sách phiên bản còn hàng."
    });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'Không có file được tải lên' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'product_variants',
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