const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', cartController.addToCart);

// Lấy thông tin giỏ hàng
router.get('/', cartController.getCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/items/:cartItemId', cartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/items/:cartItemId', cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', cartController.clearCart);

module.exports = router; 