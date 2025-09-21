const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');

// Promisify db methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Drop and recreate tables to ensure they have the correct schema
const recreateTables = async () => {
    try {
        console.log('Starting database table recreation...');
        
        // Disable foreign key constraints temporarily
        await dbRun('PRAGMA foreign_keys = OFF');
        
        // Drop tables if they exist (in reverse order due to foreign key constraints)
        await dbRun('DROP TABLE IF EXISTS OrderItems');
        await dbRun('DROP TABLE IF EXISTS Orders');
        await dbRun('DROP TABLE IF EXISTS Cart');
        
        // Re-enable foreign key constraints

        // Recreate tables with correct schema
        await dbRun(`CREATE TABLE IF NOT EXISTS Cart (
            id TEXT PRIMARY KEY DEFAULT (uuidv4()),
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customersDetails(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS Orders (
            id TEXT PRIMARY KEY DEFAULT (uuidv4()),
            customer_id TEXT NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customersDetails(id)
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS OrderItems (
            id TEXT PRIMARY KEY DEFAULT (uuidv4()),
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        // Verify tables were created
        const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Cart', 'Orders', 'OrderItems')");
        console.log('Database tables recreated successfully. Current tables:', tables);
    } catch (error) {
        console.error('Error recreating database tables:', error);
    }
};

// Call the function to recreate tables
recreateTables();
