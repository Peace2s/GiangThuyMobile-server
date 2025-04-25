const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/add', cartController.addToCart);

router.get('/', cartController.getCart);

router.put('/items/:cartItemId', cartController.updateCartItem);

router.delete('/items/:cartItemId', cartController.removeFromCart);

router.delete('/clear', cartController.clearCart);

module.exports = router; 