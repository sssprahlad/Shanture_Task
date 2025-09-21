const { getDb } = require('../config/db');
const { promisify } = require('util');

// Initialize the database and create tables if they don't exist
const initDb = async () => {
  try {
    const db = await getDb();
    const run = promisify(db.run).bind(db);
    
    await run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0
    )`);
    
    console.log('Products table initialized');
  } catch (error) {
    console.error('Error initializing products table:', error);
    throw error;
  }
};

// Initialize the database when this module is loaded
initDb().catch(console.error);

const sampleProducts = [
    {
      "id": "1e2d3f4a-1234-5678-9abc-111111111111",
      "name": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones with noise cancellation and long battery life.",
      "price": 79.99,
      "image": "https://images.unsplash.com/photo-1580894894513-ec91a06a1e84",
      "stock": 25
    },
    {
      "id": "2f3g4h5i-2345-6789-abcd-222222222222",
      "name": "Smartphone 5G",
      "description": "Latest smartphone with 5G support, 128GB storage, and AMOLED display.",
      "price": 699.0,
      "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
      "stock": 15
    },
    {
      "id": "3h4i5j6k-3456-789a-bcde-333333333333",
      "name": "Gaming Laptop",
      "description": "Powerful gaming laptop with Intel i7, RTX 3060, and 16GB RAM.",
      "price": 1299.5,
      "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      "stock": 8
    },
    {
      "id": "4i5j6k7l-4567-89ab-cdef-444444444444",
      "name": "Digital Camera",
      "description": "Compact digital camera with 24MP lens and 4K video recording.",
      "price": 499.99,
      "image": "https://images.unsplash.com/photo-1519183071298-a2962be96c85",
      "stock": 12
    },
    {
      "id": "5j6k7l8m-5678-9abc-def0-555555555555",
      "name": "Smart Watch",
      "description": "Feature-packed smartwatch with heart rate monitor and GPS.",
      "price": 199.99,
      "image": "https://images.unsplash.com/photo-1519400191622-4c1dcd5d3e4d",
      "stock": 30
    },
    {
      "id": "6k7l8m9n-6789-abcd-ef01-666666666666",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with long battery life and fast response.",
      "price": 25.5,
      "image": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04",
      "stock": 50
    },
    {
      "id": "7l8m9n0o-789a-bcde-f012-777777777777",
      "name": "Mechanical Keyboard",
      "description": "RGB backlit mechanical keyboard with blue switches.",
      "price": 89.99,
      "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      "stock": 20
    },
    {
      "id": "8m9n0o1p-89ab-cdef-0123-888888888888",
      "name": "4K LED TV",
      "description": "55-inch Ultra HD 4K LED Smart TV with HDR support.",
      "price": 899.0,
      "image": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04",
      "stock": 10
    },
    {
      "id": "9n0o1p2q-9abc-def0-1234-999999999999",
      "name": "Portable Speaker",
      "description": "Waterproof Bluetooth speaker with 12 hours of playtime.",
      "price": 59.99,
      "image": "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
      "stock": 40
    },
    {
      "id": "0o1p2q3r-abcd-ef01-2345-000000000000",
      "name": "Tablet",
      "description": "10.5-inch tablet with stylus support and 64GB storage.",
      "price": 349.99,
      "image": "https://images.unsplash.com/photo-1580894732444-8a71d79e9f73",
      "stock": 18
    },
    {
      "id": "aa1bb2cc-2345-6789-abcd-111122223333",
      "name": "DSLR Camera Lens",
      "description": "50mm f/1.8 lens for DSLR cameras, perfect for portraits.",
      "price": 129.99,
      "image": "https://images.unsplash.com/photo-1519183071298-a2962be96c85",
      "stock": 22
    },
    {
      "id": "bb2cc3dd-3456-789a-bcde-222233334444",
      "name": "Smart Home Hub",
      "description": "Voice-controlled smart home hub compatible with Alexa and Google Assistant.",
      "price": 149.0,
      "image": "https://images.unsplash.com/photo-1603791452906-bc1e3a8b1d57",
      "stock": 14
    },
    {
      "id": "cc3dd4ee-4567-89ab-cdef-333344445555",
      "name": "Fitness Tracker",
      "description": "Lightweight fitness tracker with heart rate monitor and sleep tracking.",
      "price": 79.0,
      "image": "https://images.unsplash.com/photo-1519400191622-4c1dcd5d3e4d",
      "stock": 35
    },
    {
      "id": "dd4ee5ff-5678-9abc-def0-444455556666",
      "name": "Drone with Camera",
      "description": "Quadcopter drone with 1080p HD camera and GPS.",
      "price": 599.0,
      "image": "https://images.unsplash.com/photo-1508612761958-e931d843bdd0",
      "stock": 6
    },
    {
      "id": "ee5ff6gg-6789-abcd-ef01-555566667777",
      "name": "VR Headset",
      "description": "Immersive VR headset with motion tracking and 3D audio.",
      "price": 399.99,
      "image": "https://images.unsplash.com/photo-1623039405147-98a32956543a",
      "stock": 9
    },
    {
      "id": "ff6gg7hh-789a-bcde-f012-666677778888",
      "name": "Coffee Maker",
      "description": "Automatic coffee maker with programmable timer and grinder.",
      "price": 129.5,
      "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      "stock": 28
    },
    {
      "id": "gg7hh8ii-89ab-cdef-0123-777788889999",
      "name": "Microwave Oven",
      "description": "1000W microwave oven with grill and convection modes.",
      "price": 229.0,
      "image": "https://images.unsplash.com/photo-1586201375761-83865001e17d",
      "stock": 11
    },
    {
      "id": "hh8ii9jj-9abc-def0-1234-888899990000",
      "name": "Air Conditioner",
      "description": "1.5-ton split AC with inverter technology and fast cooling.",
      "price": 699.0,
      "image": "https://images.unsplash.com/photo-1598300057685-3c5bb7e7608f",
      "stock": 7
    },
    {
      "id": "ii9jj0kk-abcd-ef01-2345-999900001111",
      "name": "Refrigerator",
      "description": "Double-door refrigerator with 300L capacity and frost-free cooling.",
      "price": 599.0,
      "image": "https://images.unsplash.com/photo-1606813902781-8b8f4b6f2f0a",
      "stock": 13
    },
    {
      "id": "jj0kk1ll-bcde-f012-3456-000011112222",
      "name": "Washing Machine",
      "description": "Front-load washing machine with 7kg capacity and eco wash feature.",
      "price": 499.0,
      "image": "https://images.unsplash.com/photo-1621891337386-3d6b7a3e02aa",
      "stock": 10
    }
  ]
  

class Product {
    static async create(productData) {
        const { id, name, description, price, image, stock } = productData;
       
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO products (id, name, description, price, image, category, stock) VALUES 
                (?, ?, ?, ?, ?, ?, ?)`, 
                sampleProducts.map(product => [
                    product.id, 
                    product.name, 
                    product.description, 
                    product.price, 
                    product.image, 
                    product.stock
                ])
            );
        });
    }
    
}

module.exports = Product;
