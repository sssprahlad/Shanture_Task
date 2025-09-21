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

exports.addToCart = async (req, res) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    const customer_id = req.user?.id; // Get customer ID from authenticated user

    console.log('Adding to cart:', { productId, quantity, customer_id });
    
    // Input validation
    if (!productId) {
        console.error('Product ID is required');
        return res.status(400).json({ 
            success: false,
            error: 'Product ID is required' 
        });
    }

    if (isNaN(quantity) || quantity < 1) {
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
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        // Check if product exists
        const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
            
        if (!product) {
            console.log('Product not found:', productId);
            await db.run('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                error: 'Product not found' 
            });
        }

        // Check if item already in cart
        const cartItem = await db.get(
            'SELECT * FROM Cart WHERE customer_id = ? AND product_id = ?', 
            [customer_id, productId]
        );

        if (cartItem) {
            // Update existing cart item
            await db.run(
                'UPDATE Cart SET quantity = quantity + ?, updated_at = datetime("now") WHERE id = ?',
                [quantity, cartItem.id]
            );
        } else {
            // Add new item to cart
            const cartItemId = uuidv4();
            await db.run(
                `INSERT INTO Cart (id, customer_id, product_id, quantity, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [cartItemId, customer_id, productId, quantity]
            );
        }

        // Commit transaction
        await db.run('COMMIT');

        // Get updated cart
        const updatedCart = await db.all(
            `SELECT c.id, c.product_id, p.name, p.price, c.quantity, p.image 
             FROM Cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.customer_id = ?`,
            [customer_id]
        );

        return res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cart: updatedCart || []
        });

    } catch (error) {
        console.error('Error in addToCart:', error);
        try {
            if (db) await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to update cart',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
    const customer_id = req.user.id;
    
    try {
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
        
        // Combine orders with their items
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: itemsByOrderId[order.id] || [],
            // Format date for display
            formatted_date: new Date(order.order_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));
        
        res.json(ordersWithItems);
        
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
};

// Create a new order from cart
exports.createOrder = (req, res) => {
    const customer_id = req.user?.id;
    if (!customer_id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            details: 'No user ID found in request'
        });
    }
    
    const order_id = uuidv4();
    const order_date = new Date().toISOString();
    const { items } = req.body;
    
    console.log('Creating new order for customer:', customer_id);
    console.log('Received items for order:', JSON.stringify(items, null, 2));
    
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
        price: parseFloat(item.price) || 0
    }));
    
    console.log('Processed cart items:', JSON.stringify(cartItems, null, 2));
    
    // Start transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Validate cart items with detailed error logging
        const invalidItems = cartItems.filter(item => !(
            item.product_id && 
            item.quantity > 0 && 
            item.price > 0
        ));
        
        if (invalidItems.length > 0) {
            console.error('Invalid cart items found:', JSON.stringify(invalidItems, null, 2));
            return db.run('ROLLBACK', () => {
                res.status(400).json({
                    success: false,
                    error: 'Invalid cart items data',
                    details: {
                        message: 'Some items are missing required fields or have invalid values',
                        invalidItems: invalidItems,
                        requiredFields: ['product_id (string)', 'quantity (number > 0)', 'price (number > 0)']
                    }
                });
            });
        }
        
        // 1. Create order
        db.run(
            'INSERT INTO Orders (id, customer_id, order_date, status, total) VALUES (?, ?, ?, ?, ?)',
            [order_id, customer_id, order_date, 'pending', 0],
            function(err) {
                if (err) {
                    console.error('Error creating order:', err);
                    return db.run('ROLLBACK', () => {
                        res.status(500).json({
                            success: false,
                            error: 'Failed to create order',
                            details: err.message
                        });
                    });
                }
                
                let total = 0;
                let itemsProcessed = 0;
                
                // Handle case where there are no items (shouldn't happen due to earlier validation)
                if (cartItems.length === 0) {
                    return db.run('ROLLBACK', () => {
                        res.status(400).json({
                            success: false,
                            error: 'No items in cart'
                        });
                    });
                }
                
                // 2. Add order items
                cartItems.forEach((item) => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    
                    db.run(
                        'INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [order_id, item.product_id, item.quantity, item.price],
                        function(err) {
                            if (err) {
                                console.error('Error adding order item:', err);
                                return db.run('ROLLBACK', () => {
                                    res.status(500).json({
                                        success: false,
                                        error: 'Failed to add order item',
                                        details: err.message
                                    });
                                });
                            }
                            
                            itemsProcessed++;
                            
                            // When all items are processed
                            if (itemsProcessed === cartItems.length) {
                                // 3. Update order total
                                db.run(
                                    'UPDATE Orders SET total = ? WHERE id = ?',
                                    [total, order_id],
                                    function(err) {
                                        if (err) {
                                            console.error('Error updating order total:', err);
                                            return db.run('ROLLBACK', () => {
                                                res.status(500).json({
                                                    success: false,
                                                    error: 'Failed to update order total',
                                                    details: err.message
                                                });
                                            });
                                        }
                                        
                                        // 4. Clear cart
                                        db.run(
                                            'DELETE FROM Cart WHERE customer_id = ?',
                                            [customer_id],
                                            function(err) {
                                                if (err) {
                                                    console.error('Error clearing cart:', err);
                                                    return db.run('ROLLBACK', () => {
                                                        res.status(500).json({
                                                            success: false,
                                                            error: 'Failed to clear cart',
                                                            details: err.message
                                                        });
                                                    });
                                                }
                                                
                                                // Commit transaction
                                                db.run('COMMIT', (commitErr) => {
                                                    if (commitErr) {
                                                        console.error('Error committing transaction:', commitErr);
                                                        return res.status(500).json({
                                                            success: false,
                                                            error: 'Failed to complete order',
                                                            details: commitErr.message
                                                        });
                                                    }

                                                    console.log('Order created successfully:', order_id);
                                                    res.status(201).json({
                                                        success: true,
                                                        message: 'Order created successfully',
                                                        order_id,
                                                        total: parseFloat(total.toFixed(2))
                                                    });
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        }
                    );
                });
            }
        );
    });
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