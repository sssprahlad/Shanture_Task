import { useState, useEffect, navigate } from "react";
import axios from "axios";
import './Cart.css';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Cart = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to view your cart');
                    setLoading(false);
                    return;
                }

                const response = await axios.get("http://localhost:8080/api/cart", {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setCart(response.data || { items: [] });
            } catch (err) {
                console.error('Error fetching cart:', err);
                setError(err.response?.data?.error || 'Failed to load cart. Please try again later.');
                setCart({ items: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    const handleRemoveFromCart = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to modify your cart');
                return;
            }
            
            const response = await axios.delete(
                `http://localhost:8080/api/cart/items/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                // Update the cart state by removing the deleted item
                setCart(prevCart => ({
                    ...prevCart,
                    items: prevCart.items.filter(item => item.cart_id !== id),
                    itemCount: prevCart.itemCount - 1,
                    total: parseFloat((prevCart.total - (response.data.removedItemPrice || 0)).toFixed(2))
                }));
            } else {
                setError(response.data.error || 'Failed to remove item');
            }
        } catch (err) {
            console.error('Error removing item:', err);
            setError('Failed to remove item. Please try again.');
        }
    };

    const handleCheckout = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to complete your order');
            return;
        }

        if (!cart.items || cart.items.length === 0) {
            setError('Your cart is empty. Please add items before checking out.');
            return;
        }

        try {
            // First, make sure we have the latest cart data
            const cartResponse = await axios.get('http://localhost:8080/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const latestCart = cartResponse.data;
            
            if (!latestCart || !latestCart.items || latestCart.items.length === 0) {
                throw new Error('Your cart is empty');
            }

            // Debug: Log the latest cart data
            console.log('Latest cart data:', JSON.stringify(latestCart, null, 2));

            // Map cart items to the format expected by the backend
            const orderItems = latestCart.items.map(item => {
                // Ensure we have all required fields with proper types
                const orderItem = {
                    product_id: String(item.product_id || item.id || ''),
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price || item.product?.price || 0)
                };
                
                // Validate the item
                if (!orderItem.product_id || orderItem.quantity <= 0 || orderItem.price <= 0) {
                    console.error('Invalid cart item:', item);
                    throw new Error('One or more items in your cart are invalid');
                }
                
                return orderItem;
            });

            // Create order data
            const orderData = {
                customer_id: localStorage.getItem('user_id'),
                order_date: new Date().toISOString(),
                status: 'pending',
                items: orderItems
            };
            
            console.log('Sending order data:', JSON.stringify(orderData, null, 2));

            const response = await axios.post('http://localhost:8080/api/orders', orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Order created:', response.data);
            setCart({ items: [], total: 0, itemCount: 0 });
            // Optionally show success message or redirect
            navigate('/orders');
        } catch (error) {
            console.error('Order creation failed:', error);
            setError(error.response?.data?.error || error.message || 'Failed to create order. Please try again.');
        }
    };
        
    

    const calculateTotal = () => {
        if (!cart?.items || cart.items.length === 0) return '0.00';
        
        const total = cart.items.reduce((sum, item) => {
            const itemPrice = item.price || item.product?.price || 0;
            const itemQuantity = item.quantity || 1;
            return sum + (itemPrice * itemQuantity);
        }, 0);
        
        return total.toFixed(2);
    };
    
    const calculateItemsCount = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((count, item) => count + (item.quantity || 1), 0);
    };

    if (loading) {
        return (
            <div className="cart-loading">
                <div className="spinner"></div>
                <p>Loading your cart...</p>
            </div>
        );
    }

    if(cart?.items?.length === 0){
        return (
            <div className="cart-container">
                <h2>Your Shopping Cart</h2>
                <div className="cart-summary">
                    <span className="items-count">{calculateItemsCount()} {calculateItemsCount() === 1 ? 'item' : 'items'}</span>
                    <span className="total-amount">Total: ${calculateTotal()}</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (cart?.items?.length === 0) {
        return (
            <div className="empty-cart">
              {cart?.items?.map(item => (
                <div key={item.cart_id} className="cart-item">
                  <div className="item-image">
                    <img 
                      src={item.image || 'https://via.placeholder.com/100'} 
                      alt={item.name} 
                    />
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name || 'Product'}</h3>
                    <p className="item-price">${item.price?.toFixed(2) || '0.00'}</p>
                    <div className="quantity-display">
                      <span className="quantity-label">Qty: </span>
                      <span className="quantity">{item.quantity}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveFromCart(item.cart_id)}
                      aria-label="Remove item"
                    >
                      <FaTrash />
                    </button>
                    <div className="item-total">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="cart-summary-section">
                <div className="summary-row">
                  <span>Total Items:</span>
                  <span>{cart?.totalQuantity || 0}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>${(cart?.totalAmount || 0).toFixed(2)}</span>
                </div>
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1 className="cart-title">Your Shopping Cart</h1>
            <div className="cart-content">
                <div className="cart-items">
                    {cart?.items?.map(item => (
                        <div key={item.cart_id} className="cart-item">
                            <div className="item-image">
                                <img 
                                    src={item.image || 'https://via.placeholder.com/100'} 
                                    alt={item.name} 
                                />
                            </div>
                            <div className="item-details">
                                <h3 className="item-name">{item.name || 'Product'}</h3>
                                <p className="item-price">${item.price?.toFixed(2) || '0.00'}</p>
                                
                                <div className="quantity-display">
                                    <span className="quantity-label">Qty: </span>
                                    <span className="quantity">{item.quantity}</span>
                                </div>
                            </div>
                            <div className="item-actions">
                                <button 
                                    className="remove-btn"
                                    onClick={() => handleRemoveFromCart(item.cart_id)}
                                    aria-label="Remove item"
                                >
                                    <FaTrash />
                                </button>
                                <div className="item-total">
                                    ${((item.price || 0) * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    
                    <div className="summary-details">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${(cart?.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span className="free-shipping">Free</span>
                        </div>
                        <div className="summary-row">
                            <span>Total Items</span>
                            <span>{cart?.totalQuantity || 0}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-total">
                            <span>Total</span>
                            <span>${(cart?.totalAmount || 0).toFixed(2)}</span>
                        </div>
                         <button className="checkout-btn" onClick={handleCheckout}>
                        Proceed to Checkout
                    </button>
                    </div>
                    
                    {/* <button className="checkout-btn" onClick={handleCheckout}>
                        Proceed to Checkout
                    </button> */}
                    {/* <Link to="/products" className="continue-shopping-link">
                        Continue Shopping
                    </Link> */}
                     {/* <button className="checkout-btn" onClick={handleCheckout}>
                        Proceed to Checkout
                    </button> */}
                </div>
                  
            </div>
        </div>
    );
};

export default Cart;