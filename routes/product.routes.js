module.exports = app => {
    const products = require("../controllers/product.controller.js");
    const router = require("express").Router();
  
    // Tạo sản phẩm mới
    router.post("/", products.create);
  
    // Lấy tất cả sản phẩm (với filter)
    router.get("/", products.findAll);
  
    // Lấy sản phẩm theo category
    router.get("/category/:category", products.findByCategory);
  
    // Lấy một sản phẩm theo id
    router.get("/:id", products.findOne);
  
    // Cập nhật sản phẩm
    router.put("/:id", products.update);
  
    // Xóa sản phẩm
    router.delete("/:id", products.delete);
  
    app.use('/api/products', router);
  };