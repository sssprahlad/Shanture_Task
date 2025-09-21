const { getDb } = require('../config/db');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Initialize the database and create tables if they don't exist
const initDb = async () => {
  try {
    const db = await getDb();
    const run = promisify(db.run).bind(db);
    
    await run(`
      CREATE TABLE IF NOT EXISTS customersDetails (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        image TEXT,
        region TEXT
      )
    `);
    
    console.log('Customers table initialized');
  } catch (error) {
    console.error('Error initializing customers table:', error);
    throw error;
  }
};

// Initialize the database when this module is loaded
initDb().catch(console.error);

// Create promisified versions of database methods
const getDbWithPromises = async () => {
  const db = await getDb();
  return {
    run: promisify(db.run).bind(db),
    get: promisify(db.get).bind(db),
    all: promisify(db.all).bind(db)
  };
};

class Customer {
  static async create(customerData) {
    const { username, email, password, full_name, phone, address, image } = customerData;
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const db = await getDbWithPromises();
      
      await db.run(
        `INSERT INTO customersDetails 
         (id, username, email, password, full_name, phone, address, image) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username, email, hashedPassword, full_name, phone || null, address || null, image || null]
      );
      
      return { id, username, email, full_name, phone, address, image };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already registered');
        }
      }
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const db = await getDbWithPromises();
      const user = await db.get(
        'SELECT * FROM customersDetails WHERE username = ?', 
        [username]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const db = await getDbWithPromises();
      const user = await db.get(
        'SELECT * FROM customersDetails WHERE id = ?', 
        [id]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateCustomer(id, updateData) {
    try {
      const db = await getDbWithPromises();
      
      // First, check if user exists
      const user = await db.get('SELECT * FROM customersDetails WHERE id = ?', [id]);
      if (!user) {
        throw new Error('User not found');
      }
      
      const fields = [];
      const values = [];
      const timestamp = new Date().toISOString();
      const updateableFields = ['username', 'email', 'full_name', 'phone', 'address', 'image'];
      
      // Build the SET clause and values
      updateableFields.forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== null) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });

      if (fields.length === 0) {
        return user;
      }

      // Add updated_at to fields
      fields.push('updated_at = ?');
      values.push(timestamp);
      
      // Add id for WHERE clause
      values.push(id);

      // Build and execute the update query
      const query = `UPDATE customersDetails SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);

      // Return the updated user
      const updatedUser = await db.get(
        'SELECT id, username, email, full_name, phone, address, image FROM customersDetails WHERE id = ?',
        [id]
      );
      
      return updatedUser;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already registered');
        }
      }
      console.error('Error updating customer:', error);
      throw error;
    }
  }
  }

  module.exports = Customer;
