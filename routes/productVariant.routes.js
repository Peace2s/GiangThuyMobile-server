const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const variants = require('../controllers/productVariant.controller.js');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/', variants.create);

router.get('/product/:productId', variants.findAllByProduct);

router.get('/product/:productId/available', variants.getAvailableVariants);

router.get('/:id', variants.findOne);

router.put('/:id', variants.update);

router.delete('/:id', variants.delete);

router.post('/upload', upload.single('image'), variants.uploadImage);

module.exports = router; 