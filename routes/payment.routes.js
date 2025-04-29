const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/create-payment-url', authMiddleware, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);

module.exports = router; 