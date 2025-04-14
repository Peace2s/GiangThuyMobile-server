const db = require("../models");
const Product = db.products;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.send(product);
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
  const id = req.params.id;

  try {
    const num = await Product.update(req.body, {
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "Sản phẩm đã được cập nhật thành công."
      });
    } else {
      res.send({
        message: `Không thể cập nhật sản phẩm với id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Lỗi khi cập nhật sản phẩm với id=" + id
    });
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