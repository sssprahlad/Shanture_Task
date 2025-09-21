require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// Import and initialize database models
require('./models/Product'); // This will run the table creation code
const db = require('./config/db');

const corsOptions = {
  origin: "http://localhost:3000", 
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));

// Database connection check
app.use((req, res, next) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  next();
});

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/ordersRouter');

// Use routes
app.use('/api', customerRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);

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

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API Documentation: http://localhost:${port}/api-docs`);
  console.log(`Uploads directory: ${uploadsDir}`);
});