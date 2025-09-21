const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        // Check if products table exists
        try {
            await db.get("SELECT 1 FROM products LIMIT 1");
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
                
                // Insert sample data
                await insertSampleProducts();
            } else {
                throw tableError;
            }
        }
        
        // Get all products
        const products = await db.query("SELECT * FROM products ORDER BY name");
        
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

// Insert sample products
async function insertSampleProducts() {
    const sampleProducts = [
        {
            id: uuidv4(),
            name: 'Smartphone 5G',
            description: 'Latest smartphone with 5G support, 128GB storage, and AMOLED display.',
            price: 699.99,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
            category: 'Electronics',
            stock: 50
        },
        {
            id: uuidv4(),
            name: 'Laptop',
            description: 'Powerful laptop for work and gaming',
            price: 1299.99,
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
            category: 'Electronics',
            stock: 25
        },
        {
            id: uuidv4(),
            name: 'Coffee Maker',
            description: 'Automatic coffee maker with programmable timer and grinder.',
            price: 129.50,
            image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
            category: 'Home Appliances',
            stock: 30
        },
        {
            id: uuidv4(),
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation and long battery life.',
            price: 79.99,
            image: 'https://images.unsplash.com/photo-1580894894513-ec91a06a1e84',
            category: 'Electronics',
            stock: 25
        }
    ];

    try {
        const stmt = `
            INSERT INTO products (id, name, description, price, image, category, stock)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const product of sampleProducts) {
            await db.run(stmt, [
                product.id,
                product.name,
                product.description,
                product.price,
                product.image,
                product.category,
                product.stock
            ]);
        }
        console.log('Inserted sample products');
    } catch (error) {
        console.error('Error inserting sample products:', error);
        throw error;
    }
}

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
