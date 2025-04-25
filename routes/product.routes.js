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

router.get("/search", products.searchProducts);

router.get('/featured', products.getFeaturedProducts);

router.get('/new', products.getNewProducts);

router.get('/brand/:brand', products.getProductsByBrand);

router.post('/', products.create);

router.get('/', products.findAll);

router.get('/:id', products.findOne);

router.put('/:id', products.update);

router.delete('/:id', products.delete);

router.post('/upload', upload.single('image'), products.uploadImage);

module.exports = router;