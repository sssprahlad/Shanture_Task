require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

require('./models/Product'); 
const db = require('./config/db');

// Set CORS based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Configure allowed origins
const allowedOrigins = isProduction 
  ? [
      process.env.FRONTEND_URL || 'https://your-render-app-url.onrender.com',
      'http://localhost:3000'  // Keep localhost for development testing
    ]
  : 'http://localhost:3000';

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight request for 10 minutes
};

// Log CORS configuration
console.log('CORS Allowed Origins:', allowedOrigins);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  next();
});

const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/ordersRouter');
const cartRoutes = require('./routes/cartRouter');
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// In production, serve static files from the React frontend app
if (isProduction) {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Create server with error handling for port in use
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running in ${isProduction ? 'production' : 'development'} mode on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying port ${parseInt(PORT) + 1}...`);
    // Try the next port
    const newPort = parseInt(PORT) + 1;
    server.listen(newPort, HOST);
  } else {
    console.error('Server error:', err);
  }
});