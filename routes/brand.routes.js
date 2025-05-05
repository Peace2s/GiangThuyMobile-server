const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Public routes
router.get('/', brandController.findAll);
router.get('/:id', brandController.findOne);

// Protected routes (admin only)
router.post('/', authMiddleware, adminMiddleware, brandController.create);
router.put('/:id', authMiddleware, adminMiddleware, brandController.update);
router.delete('/:id', authMiddleware, adminMiddleware, brandController.delete);

module.exports = router; 