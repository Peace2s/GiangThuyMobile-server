const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware);

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Lấy danh sách đơn hàng của người dùng
router.get('/', orderController.getUserOrders);

// Lấy chi tiết đơn hàng
router.get('/:orderId', orderController.getOrderDetails);

// Hủy đơn hàng
router.put('/:orderId/cancel', orderController.cancelOrder);

module.exports = router; 