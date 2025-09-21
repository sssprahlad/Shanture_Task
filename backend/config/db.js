const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require('fs');
const { promisify } = require('util');

const dbPath = path.resolve(__dirname, "../shanture.db");

// Ensure the database file exists
const ensureDbFile = () => {
    if (!fs.existsSync(dbPath)) {
        console.log('Creating new database file at:', dbPath);
        fs.writeFileSync(dbPath, '');
    }
};

// Create a database connection with better error handling
const createDatabase = () => {
    ensureDbFile();
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error("Database connection error:", err.message);
                return reject(err);
            }
            
            console.log("Connected to SQLite database:", dbPath);
            
            // Enable foreign key constraints
            db.serialize(() => {
                db.run("PRAGMA foreign_keys = ON", (err) => {
                    if (err) {
                        console.error("Failed to enable foreign key constraints:", err);
                        return reject(err);
                    }
                    
                    // Promisify the database methods for async/await
                    const dbRun = promisify(db.run.bind(db));
                    const dbGet = promisify(db.get.bind(db));
                    const dbAll = promisify(db.all.bind(db));
                    
                    const close = () => {
                        return new Promise((resolveClose) => {
                            db.close((err) => {
                                if (err) {
                                    console.error('Error closing database:', err);
                                } else {
                                    console.log('Database connection closed');
                                }
                                resolveClose();
                            });
                        });
                    };
                    
                    // Add error handler for the database connection
                    db.on('error', (err) => {
                        console.error('Database error:', err);
                    });
                    
                    resolve({
                        db,
                        run: dbRun,
                        get: dbGet,
                        all: dbAll,
                        close
                    });
                });
            });
        });
    });
};

// Create a singleton instance
let dbInstance = null;

const getDb = async () => {
    if (!dbInstance) {
        dbInstance = await createDatabase();
    }
    return dbInstance;
};

// Close the database connection
const closeDb = async () => {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    await closeDb();
    process.exit(0);
});

// Export the database instance and methods
module.exports = {
    getDb,
    closeDb,
    
    // Helper methods for direct use
    async query(sql, params = []) {
        const db = await getDb();
        return db.all(sql, params);
    },
    
    async get(sql, params = []) {
        const db = await getDb();
        return db.get(sql, params);
    },
    
    async run(sql, params = []) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) return reject(err);
                resolve({ 
                    id: this.lastID, 
                    changes: this.changes 
                });
            });
        });
    }
};
