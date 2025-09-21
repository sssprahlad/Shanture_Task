const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Cart routes
router.post('/:productId', orderController.addToCart);
router.get('/', orderController.getCart);
router.delete('/items/:id', orderController.removeFromCart);
router.put('/items/:cartItemId', orderController.updateCartItem);

module.exports = router;
