const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
// Use environment variable or a fallback secret (for development only)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_key_here';

exports.registerCustomer = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, address, region } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields (username, email, password, full_name)' 
      });
    }

    const customer = await Customer.create({
      username,
      email,
      password,
      full_name,
      phone,
      address,
      image: imagePath,
      region
    });

    const token = jwt.sign(
      { id: customer.id, username: customer.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password: _, ...userWithoutPassword } = customer;

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        user: userWithoutPassword,
        // token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'Username already exists' || error.message === 'Email already registered') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};


exports.loginCustomer = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password'
      });
    }

    const customer = await Customer.findByUsername(username);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await Customer.comparePassword(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: customer.id, username: customer.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password: _, ...userWithoutPassword } = customer;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};


exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    delete customer.password;
    
    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCustomerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Handle file upload if present
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }
        
        // Remove any fields that shouldn't be updated
        const disallowedFields = ['id', 'created_at', 'password'];
        disallowedFields.forEach(field => delete updateData[field]);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid fields to update' 
            });
        }

      
        const updatedCustomer = await Customer.updateCustomer(id, updateData);
        
        if (!updatedCustomer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Customer not found or update failed' 
            });
        }

        
        let newToken;
        if (updateData.email || updateData.username) {
            const tokenData = {
                id: updatedCustomer.id,
                username: updatedCustomer.username,
                email: updatedCustomer.email
            };
            newToken = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '1h' });
        }

        
        const response = {
            success: true,
            message: 'Profile updated successfully',
            customer: {
                id: updatedCustomer.id,
                username: updatedCustomer.username,
                email: updatedCustomer.email,
                full_name: updatedCustomer.full_name,
                phone: updatedCustomer.phone,
                address: updatedCustomer.address,
                image: updatedCustomer.image,
                region: updatedCustomer.region
            }
        };

        if (newToken) {
            response.token = newToken;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Error updating customer profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile',
            error: error.message 
        });
    }
};