const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const products = require('../controllers/product.controller.js');

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

// Search products (đặt trước các route có param)
router.get("/search", products.searchProducts);

// Get featured products
router.get('/featured', products.getFeaturedProducts);

// Get new products
router.get('/new', products.getNewProducts);

// Get products by brand
router.get('/brand/:brand', products.getProductsByBrand);

// Create a new product
router.post('/', products.create);

// Get all products
router.get('/', products.findAll);

// Get a single product with id
router.get('/:id', products.findOne);

// Update a product with id
router.put('/:id', products.update);

// Delete a product with id
router.delete('/:id', products.delete);

// Upload product image
router.post('/upload', upload.single('image'), products.uploadImage);

module.exports = router;