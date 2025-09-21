const { getDb } = require('../config/db');
const { promisify } = require('util');

// Helper function to promisify db methods
const getDbWithPromises = async () => {
    const db = await getDb();
    return {
        all: promisify(db.all).bind(db),
        get: promisify(db.get).bind(db),
        run: promisify(db.run).bind(db)
    };
};

// Get all products
exports.getProducts = async (req, res) => {
    let db;
    try {
        db = await getDbWithPromises();
        
        // Check if products table exists and get count
        let count = 0;
        try {
            const row = await db.get("SELECT COUNT(*) as count FROM products");
            count = row ? row.count : 0;
        } catch (tableError) {
            if (tableError.message.includes('no such table')) {
                // Table doesn't exist, create it
                await db.run(`
                    CREATE TABLE IF NOT EXISTS products (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL,
                        price REAL NOT NULL,
                        image TEXT NOT NULL,
                        category TEXT,
                        stock INTEGER DEFAULT 0
                    )
                `);
                console.log('Created products table');
            } else {
                throw tableError;
            }
        }

        // If the table is empty, insert sample data
        if (count === 0) {
            console.log('No products found, inserting sample data...');
            const sampleProducts = [
                {
                    id: '1e2d3f4a-1234-5678-9abc-111111111111',
                    name: 'Wireless Bluetooth Headphones',
                    description: 'High-quality wireless headphones with noise cancellation and long battery life.',
                    price: 79.99,
                    image: 'https://images.unsplash.com/photo-1580894894513-ec91a06a1e84',
                    stock: 25
                },
                {
                    id: '2f3g4h5i-2345-6789-abcd-222222222222',
                    name: 'Smartphone 5G',
                    description: 'Latest smartphone with 5G support, 128GB storage, and AMOLED display.',
                    price: 699.0,
                    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
                    stock: 15
                }
            ];

            for (const product of sampleProducts) {
                await db.run(
                    'INSERT INTO products (id, name, description, price, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
                    [product.id, product.name, product.description, product.price, product.image, product.stock]
                );
            }
            console.log('Sample products inserted successfully');
        }

        // Fetch all products
        const products = await db.all('SELECT * FROM products');
        
        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error('Error in getProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while processing your request',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, image, stock } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !description || !price || !image || !stock) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields (name, description, price, image, stock)' 
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: imagePath,
            stock
        });

        res.status(201).json({ 
            success: true, 
            message: 'Product created successfully',
            product 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create product',
            error: error.message 
        });
    }
};
