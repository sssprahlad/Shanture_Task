
const express = require('express');
const router = express.Router();
const productController = require('../controller/productsController');


router.get('/products', productController.getProducts);

module.exports = router;