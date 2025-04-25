const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetails);
router.put('/:orderId/cancel', orderController.cancelOrder);

router.get('/admin/all', adminMiddleware, orderController.getAllOrders);
router.put('/admin/:orderId/status', adminMiddleware, orderController.updateOrderStatus);
router.get('/admin/statistics', adminMiddleware, orderController.getOrderStatistics);

module.exports = router; 