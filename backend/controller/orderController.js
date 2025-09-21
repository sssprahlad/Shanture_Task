const { getDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper function to get database connection with promisified methods
const getDbConnection = async () => {
    try {
        const db = await getDb();
        return db;
    } catch (error) {
        console.error('Error getting database connection:', error);
        throw error;
    }
};

// Ensure the Cart table exists
const ensureCartTable = async (db) => {
    // First, check if the table exists
    const tableExists = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Cart'"
    );

    if (!tableExists) {
        // Create the table if it doesn't exist
        await db.run(`
            CREATE TABLE Cart (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                UNIQUE(customer_id, product_id)
            )
        `);
        console.log('Created Cart table');
    }
};

exports.addToCart = async (req, res) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    const customer_id = req.user?.id;

    console.log('Adding to cart:', { productId, quantity, customer_id });
    
    // Input validation
    if (!productId) {
        console.error('Product ID is required');
        return res.status(400).json({ 
            success: false,
            error: 'Product ID is required' 
        });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        console.error('Invalid quantity:', quantity);
        return res.status(400).json({ 
            success: false,
            error: 'Quantity must be a positive number' 
        });
    }

    if (!customer_id) {
        console.error('User not authenticated');
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    let db;
    try {
        db = await getDbConnection();
        if (!db) {
            throw new Error('Failed to connect to database');
        }
        
        // Ensure Cart table exists
        await ensureCartTable(db);
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        try {
            // Check if product exists and has sufficient stock
            const product = await db.get(
                'SELECT id, stock FROM products WHERE id = ?', 
                [productId]
            );
            
            if (!product) {
                throw new Error('Product not found');
            }

            // Check if item already in cart
            const cartItem = await db.get(
                'SELECT id, quantity FROM Cart WHERE customer_id = ? AND product_id = ?', 
                [customer_id, productId]
            );

            if (cartItem) {
                // Calculate new quantity
                const newQuantity = cartItem.quantity + parsedQuantity;
                
                // Check stock availability
                if (product.stock < newQuantity) {
                    throw new Error(`Only ${product.stock} items available in stock`);
                }

                // Update existing cart item
                await db.run(
                    'UPDATE Cart SET quantity = ? WHERE id = ?',
                    [newQuantity, cartItem.id]
                );
            } else {
                // Check stock availability for new item
                if (product.stock < parsedQuantity) {
                    throw new Error(`Only ${product.stock} items available in stock`);
                }

                // Add new item to cart
                const cartItemId = uuidv4();
                await db.run(
                    `INSERT INTO Cart (id, customer_id, product_id, quantity, created_at)
                     VALUES (?, ?, ?, ?, datetime('now'))`,
                    [cartItemId, customer_id, productId, parsedQuantity]
                );
            }

            // Commit transaction
            await db.run('COMMIT');

            // Get updated cart with product details
            const updatedCart = await db.all(
                `SELECT 
                    c.id, 
                    c.product_id, 
                    p.name, 
                    p.price, 
                    c.quantity, 
                    p.image,
                    (p.price * c.quantity) as item_total
                 FROM Cart c 
                 JOIN products p ON c.product_id = p.id 
                 WHERE c.customer_id = ?`,
                [customer_id]
            );

            // Calculate cart total
            const cartTotal = updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0);

            return res.status(200).json({
                success: true,
                message: 'Item added to cart successfully',
                cart: {
                    items: updatedCart,
                    total: cartTotal.toFixed(2),
                    itemCount: updatedCart.reduce((count, item) => count + item.quantity, 0)
                }
            });

        } catch (error) {
            // Rollback transaction on error
            await db.run('ROLLBACK');
            console.error('Error in addToCart transaction:', error.message);
            
            if (error.message.includes('available in stock')) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient stock',
                    details: error.message
                });
            }
            
            throw error; // This will be caught by the outer catch block
        }

    } catch (error) {
        console.error('Error in addToCart:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        
        // Try to rollback if there was a database error
        try {
            if (db) await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to add item to cart',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // Close the database connection if needed
        // if (db) await db.close();
    }
};

// Get cart contents
exports.getCart = async (req, res) => {
    const customer_id = req.user?.id; // Get customer ID from authenticated user

    if (!customer_id) {
        console.error('User not authenticated');
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    console.log('Fetching cart for customer:', customer_id);

    try {
        const db = await getDbConnection();
        
        const cartItems = await db.all(
            `SELECT c.id as cart_id, p.*, c.quantity 
             FROM Cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.customer_id = ?`,
            [customer_id]
        );
        
        console.log('Fetched cart items:', cartItems);
        return res.status(200).json({ 
            success: true,
            items: cartItems || []
        });
        
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch cart',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    const { id: cartItemId } = req.params;
    const customer_id = req.user?.id;

    console.log('Attempting to remove item from cart:', { cartItemId, customer_id });

    if (!customer_id) {
        console.error('User not authenticated');
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    let db;
    try {
        db = await getDbConnection();
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        // First, check if the cart item exists and belongs to the user
        const cartItem = await db.get(
            'SELECT * FROM Cart WHERE id = ? AND customer_id = ?',
            [cartItemId, customer_id]
        );

        if (!cartItem) {
            console.log('Cart item not found or access denied');
            await db.run('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                error: 'Cart item not found or you do not have permission to remove it' 
            });
        }

        // Delete the item
        await db.run('DELETE FROM Cart WHERE id = ?', [cartItemId]);
        
        // Commit transaction
        await db.run('COMMIT');

        console.log('Item removed from cart');
        return res.status(200).json({ 
            success: true,
            message: 'Item removed from cart' 
        });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        try {
            if (db) await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const customer_id = req.user?.id;

    console.log('Updating cart item:', { cartItemId, quantity, customer_id });

    // Input validation
    if (isNaN(quantity) || quantity < 1) {
        return res.status(400).json({ 
            success: false,
            error: 'Quantity must be a positive number' 
        });
    }

    if (!customer_id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    let db;
    try {
        db = await getDbConnection();
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        // Check if the cart item exists and belongs to the user
        const cartItem = await db.get(
            'SELECT * FROM Cart WHERE id = ? AND customer_id = ?',
            [cartItemId, customer_id]
        );

        if (!cartItem) {
            console.log('Cart item not found or access denied');
            await db.run('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                error: 'Cart item not found or you do not have permission to update it' 
            });
        }

        // Update the item
        await db.run(
            'UPDATE Cart SET quantity = ? WHERE id = ?',
            [quantity, cartItemId]
        );
        
        // Commit transaction
        await db.run('COMMIT');

        // Get the updated cart item
        const updatedItem = await db.get(
            'SELECT c.*, p.name, p.price, p.image FROM Cart c JOIN products p ON c.product_id = p.id WHERE c.id = ?',
            [cartItemId]
        );

        return res.status(200).json({ 
            success: true,
            message: 'Cart item updated',
            cartItem: updatedItem
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        try {
            if (db) await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to update cart item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all orders for a customer with their items
exports.getOrders = async (req, res) => {
    console.log('User object:', req.user);
    if (!req.user || !req.user.id) {
        console.error('No user ID found in request');
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            details: 'No user ID found in request'
        });
    }
    
    try {
        const db = require('../config/db');
        const customer_id = req.user.id;
        
        // First, get all orders for the customer
        const orders = await db.all(
            `SELECT * FROM Orders 
             WHERE customer_id = ?
             ORDER BY order_date DESC`,
            [customer_id]
        );

        if (!orders || orders.length === 0) {
            return res.json([]);
        }
        
        // Get all order IDs
        const orderIds = orders.map(order => order.id);
        const placeholders = orderIds.map(() => '?').join(',');
        
        // First, check if the created_at column exists in OrderItems
        const columnCheck = await db.get(
            "SELECT name FROM pragma_table_info('OrderItems') WHERE name = 'created_at'"
        );

        // Then get all order items for these orders
        const orderItems = await db.all(
            `SELECT oi.*, p.name as product_name, p.image as product_image
             FROM OrderItems oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (${placeholders})
             ${columnCheck ? 'ORDER BY oi.created_at' : ''}`,
            [...orderIds]
        );
        
        // Group order items by order_id
        const itemsByOrderId = orderItems.reduce((acc, item) => {
            if (!acc[item.order_id]) {
                acc[item.order_id] = [];
            }
            acc[item.order_id].push({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_image: item.product_image,
                quantity: item.quantity,
                price: item.price,
                total: (item.quantity * item.price).toFixed(2)
            });
            return acc;
        }, {});
        
        // Calculate total amount for each order if not present
        const ordersWithTotals = orders.map(order => {
            const orderItems = itemsByOrderId[order.id] || [];
            const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            
            return {
                ...order,
                total_amount: order.total_amount || totalAmount,
                items: orderItems,
                formatted_date: new Date(order.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        });
        
        return res.status(200).json({
            success: true,
            orders: ordersWithTotals
        });
        
    } catch (error) {
        console.error('Error in getOrders:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create a new order from cart
exports.createOrder = async (req, res) => {
    const db = require('../config/db');
    const customer_id = req.user?.id;
    
    if (!customer_id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            details: 'No user ID found in request'
        });
    }
    
    const orderId = uuidv4();
    const orderDate = new Date().toISOString();
    const { items, shippingAddress, paymentMethod } = req.body;
    
    console.log('Creating new order for customer:', customer_id);
    
    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No items in the order',
            details: 'Please provide at least one item to place an order'
        });
    }
    
    // Process cart items to ensure they have the required fields
    const cartItems = items.map(item => ({
        product_id: item.product_id || item.id,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        name: item.name || 'Unnamed Product'
    }));
    
    // Validate cart items
    const invalidItems = cartItems.filter(item => !(
        item.product_id && 
        item.quantity > 0 && 
        item.price >= 0
    ));
    
    if (invalidItems.length > 0) {
        console.error('Invalid cart items found:', JSON.stringify(invalidItems, null, 2));
        return res.status(400).json({
            success: false,
            error: 'Invalid cart items data',
            details: {
                message: 'Some items are missing required fields or have invalid values',
                invalidItems,
                requiredFields: ['product_id (string)', 'quantity (number > 0)', 'price (number >= 0)']
            }
        });
    }
    
    try {
        // Check if tables exist, create them if they don't
        await db.run(`
            CREATE TABLE IF NOT EXISTS Orders (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                order_date TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                total REAL NOT NULL,
                shipping_address TEXT,
                payment_method TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);
        
        await db.run(`
            CREATE TABLE IF NOT EXISTS OrderItems (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES Orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        
        // Calculate total amount
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Create order
            await db.run(
                `INSERT INTO Orders (id, customer_id, order_date, status, total, shipping_address, payment_method)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, customer_id, orderDate, 'pending', totalAmount, JSON.stringify(shippingAddress), paymentMethod]
            );
            
            // Insert order items and update product stock
            for (const item of cartItems) {
                // Insert order item
                await db.run(
                    'INSERT INTO OrderItems (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), orderId, item.product_id, item.quantity, item.price]
                );
                
                // Update product stock
                await db.run(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
            
            // Clear the cart
            await db.run('DELETE FROM Cart WHERE customer_id = ?', [customer_id]);
            
            // Commit the transaction
            await db.run('COMMIT');
            
            // Get the complete order details
            const order = await db.get(
                `SELECT * FROM Orders WHERE id = ?`,
                [orderId]
            );
            
            const orderItems = await db.all(
                `SELECT oi.*, p.name, p.image, (oi.quantity * oi.price) as item_total
                 FROM OrderItems oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [orderId]
            );
            
            return res.status(201).json({
                success: true,
                message: 'Order created successfully',
                order: {
                    ...order,
                    items: orderItems,
                    shipping_address: shippingAddress ? JSON.parse(order.shipping_address) : null
                }
            });
            
        } catch (error) {
            console.error('Error in createOrder transaction:', error);
            await db.run('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('Error in createOrder:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create order',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete an order
exports.deleteOrder = (req, res) => {
    const { orderId } = req.params;
    const customer_id = req.user?.id;

    if (!customer_id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            details: 'No user ID found in request'
        });
    }

    console.log('Deleting order:', { orderId, customer_id });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // First, verify the order belongs to the customer
        db.get(
            'SELECT id FROM Orders WHERE id = ? AND customer_id = ?',
            [orderId, customer_id],
            (err, order) => {
                if (err) {
                    console.error('Error verifying order ownership:', err);
                    return db.run('ROLLBACK', () => {
                        res.status(500).json({
                            success: false,
                            error: 'Failed to verify order ownership',
                            details: err.message
                        });
                    });
                }

                if (!order) {
                    return db.run('ROLLBACK', () => {
                        res.status(404).json({
                            success: false,
                            error: 'Order not found or does not belong to user'
                        });
                    });
                }

                // Delete order items first (due to foreign key constraint)
                db.run(
                    'DELETE FROM OrderItems WHERE order_id = ?',
                    [orderId],
                    function(err) {
                        if (err) {
                            console.error('Error deleting order items:', err);
                            return db.run('ROLLBACK', () => {
                                res.status(500).json({
                                    success: false,
                                    error: 'Failed to delete order items',
                                    details: err.message
                                });
                            });
                        }

                        // Then delete the order
                        db.run(
                            'DELETE FROM Orders WHERE id = ?',
                            [orderId],
                            function(err) {
                                if (err) {
                                    console.error('Error deleting order:', err);
                                    return db.run('ROLLBACK', () => {
                                        res.status(500).json({
                                            success: false,
                                            error: 'Failed to delete order',
                                            details: err.message
                                        });
                                    });
                                }

                                if (this.changes === 0) {
                                    return db.run('ROLLBACK', () => {
                                        res.status(404).json({
                                            success: false,
                                            error: 'Order not found or does not belong to user'
                                        });
                                    });
                                }

                                // Commit transaction
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        console.error('Error committing transaction:', err);
                                        return res.status(500).json({
                                            success: false,
                                            error: 'Failed to complete order deletion',
                                            details: err.message
                                        });
                                    }

                                    console.log('Order deleted successfully:', orderId);
                                    res.json({
                                        success: true,
                                        message: 'Order deleted successfully',
                                        order_id: orderId
                                    });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};