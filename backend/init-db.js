const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, './shanture.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database for initialization');
});

// Create tables
const createTables = () => {
    return new Promise((resolve, reject) => {
        // Create Products table
        db.serialize(() => {
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON;');

            // Create Products table
            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    price REAL NOT NULL,
                    image TEXT,
                    stock INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating products table:', err.message);
                    return reject(err);
                }
                console.log('Products table created/verified');
            });

            // Create Cart table
            db.run(`
                CREATE TABLE IF NOT EXISTS Cart (
                    id TEXT PRIMARY KEY,
                    customer_id INTEGER NOT NULL,
                    product_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating Cart table:', err.message);
                    return reject(err);
                }
                console.log('Cart table created/verified');
            });

            // Create Orders table
            db.run(`
                CREATE TABLE IF NOT EXISTS Orders (
                    id TEXT PRIMARY KEY,
                    customer_id INTEGER NOT NULL,
                    order_date DATETIME NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    total REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating Orders table:', err.message);
                    return reject(err);
                }
                console.log('Orders table created/verified');
            });

            // Create OrderItems table
            db.run(`
                CREATE TABLE IF NOT EXISTS OrderItems (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT NOT NULL,
                    product_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    price REAL NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES Orders (id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating OrderItems table:', err.message);
                    return reject(err);
                }
                console.log('OrderItems table created/verified');
                resolve();
            });
        });
    });
};

// Run the initialization
const initDatabase = async () => {
    try {
        await createTables();
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
            process.exit(0);
        });
    }
};

// Execute the initialization
initDatabase();
