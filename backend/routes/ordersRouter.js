const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { protect } = require('../middlewares/auth');


router.use(protect);


router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;