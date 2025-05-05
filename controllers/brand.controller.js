const db = require('../models');
const Brand = db.brands;

// Tạo mới brand
exports.create = async (req, res) => {
  try {
    const brand = await Brand.create({
      name: req.body.name
    });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả brands
exports.findAll = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy một brand theo id
exports.findOne = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật brand
exports.update = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    await brand.update({
      name: req.body.name
    });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa brand
exports.delete = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    await brand.destroy();
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 