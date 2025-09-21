const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Order routes
router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;