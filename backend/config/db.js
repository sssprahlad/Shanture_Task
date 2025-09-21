const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { promisify } = require('util');

const dbPath = path.resolve(__dirname, "../shanture.db");

// Create a database connection with better error handling
const createDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Database connection error:", err.message);
        return reject(err);
      }
      
      console.log("Connected to SQLite database:", dbPath);
      
      // Enable foreign key constraints
      db.get("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          console.error("Failed to enable foreign key constraints:", err);
          return reject(err);
        }
        
        // Promisify the database methods for async/await
        const dbRun = promisify(db.run.bind(db));
        const dbGet = promisify(db.get.bind(db));
        const dbAll = promisify(db.all.bind(db));
        
        // Add a close method
        const close = () => {
          return new Promise((resolveClose, rejectClose) => {
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
                return rejectClose(err);
              }
              console.log('Database connection closed');
              resolveClose();
            });
          });
        };
        
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

// Export the database instance and methods
module.exports = {
  getDb,
  closeDb
};
