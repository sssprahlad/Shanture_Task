const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController');
const { protect } = require('../middlewares/auth');
const upload = require('../utils/upload');


router.post('/register', upload.single('image'), customerController.registerCustomer);


router.post('/login', customerController.loginCustomer);


router.get('/profile', protect, customerController.getCustomerProfile);

router.patch(
  '/register/:id', 
  protect, 
  upload.single('image'), 
  customerController.updateCustomerProfile
);

module.exports = router;
