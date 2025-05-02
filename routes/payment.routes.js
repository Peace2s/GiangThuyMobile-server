const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/create-payment-url', authMiddleware, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.post('/sepay-webhook', paymentController.sepayWebhook);
router.post('/cancel-sepay-order/:orderId', authMiddleware, paymentController.cancelSepayOrder);
router.get('/check-sepay-status/:orderId', authMiddleware, paymentController.checkSepayPaymentStatus);

module.exports = router; 