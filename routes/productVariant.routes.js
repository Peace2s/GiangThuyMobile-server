const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const variants = require('../controllers/productVariant.controller.js');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Tạo biến thể mới
router.post('/', variants.create);

// Lấy tất cả biến thể của một sản phẩm
router.get('/product/:productId', variants.findAllByProduct);

// Lấy các biến thể còn hàng của một sản phẩm
router.get('/product/:productId/available', variants.getAvailableVariants);

// Lấy một biến thể theo ID
router.get('/:id', variants.findOne);

// Cập nhật biến thể
router.put('/:id', variants.update);

// Xóa biến thể
router.delete('/:id', variants.delete);

// Upload ảnh biến thể
router.post('/upload', upload.single('image'), variants.uploadImage);

module.exports = router; 