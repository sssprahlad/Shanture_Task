const express = require('express');
const router = express.Router();
const productController = require('../controller/productsController');

// GET /api/products
router.get('/', productController.getProducts);

module.exports = router;