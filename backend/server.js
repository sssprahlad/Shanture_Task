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
const allowedOrigins = isProduction 
  ? [process.env.FRONTEND_URL, 'https://your-render-app-url.onrender.com'] 
  : 'http://localhost:3000';

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
};

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

// In production, serve static files from the React frontend app
if (isProduction) {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running in ${isProduction ? 'production' : 'development'} mode on port ${PORT}`);
});