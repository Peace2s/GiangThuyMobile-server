const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware);

// Routes cho người dùng
router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetails);
router.put('/:orderId/cancel', orderController.cancelOrder);

// Routes cho admin
router.get('/admin/all', adminMiddleware, orderController.getAllOrders);
router.put('/admin/:orderId/status', adminMiddleware, orderController.updateOrderStatus);
router.get('/admin/statistics', adminMiddleware, orderController.getOrderStatistics);

module.exports = router; 