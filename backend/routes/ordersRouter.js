const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Cart routes
router.post('/cart/:productId', orderController.addToCart);
router.get('/cart', orderController.getCart);
router.delete('/cart/items/:id', orderController.removeFromCart);
router.put('/cart/items/:cartItemId', orderController.updateCartItem);

// Order routes
router.get('/orders', orderController.getOrders);
router.post('/orders', orderController.createOrder);
router.delete('/orders/:orderId', orderController.deleteOrder);

module.exports = router;