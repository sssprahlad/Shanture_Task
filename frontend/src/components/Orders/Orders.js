
import './Orders.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBox, FaCalendarAlt, FaShoppingBag, FaDollarSign, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState({});

    useEffect(() => {
        const fetchOrders = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to view your orders');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:8080/api/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setOrders(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setError(error.response?.data?.error || 'Failed to load orders. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Empty dependency array means this effect runs once when the component mounts

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled'
        };

        return (
            <span className={`status-badge ${statusClasses[status.toLowerCase()] || 'status-pending'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">{error}</p>
                {!localStorage.getItem('token') && (
                    <Link to="/login" className="login-link">
                        Log in to view your orders
                    </Link>
                )}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="no-orders">
                <FaBox className="empty-icon" />
                <h2>No Orders Yet</h2>
                <p>You haven't placed any orders yet.</p>
                <Link to="/" className="shop-now-btn">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h1 className="page-title">
                <FaShoppingBag className="title-icon" />
                My Orders
            </h1>
            
            <div className="orders-list">
                {orders.map((order) => (
                    <div key={order.id} className="order-card">
                        <div 
                            className="order-header" 
                            onClick={() => toggleOrder(order.id)}
                        >
                            <div className="order-info">
                                <div className="order-id">
                                    <span className="label">Order #</span>
                                    <span>{order.id.split('-')[0].toUpperCase()}</span>
                                </div>
                                <div className="order-date">
                                    <FaCalendarAlt className="icon" />
                                    <span>{order.formatted_date || new Date(order.order_date).toLocaleDateString()}</span>
                                </div>
                                <div className="order-status">
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                            <div className="order-total">
                                <span className="label">Total:</span>
                                <span className="amount">${parseFloat(order.total || 0).toFixed(2)}</span>
                            </div>
                            <div className={`expand-icon ${expandedOrders[order.id] ? 'expanded' : ''}`}>
                                ▼
                            </div>
                        </div>

                        {expandedOrders[order.id] && (
                            <div className="order-details">
                                <div className="order-items">
                                    <h4>Order Items</h4>
                                    {order.items && order.items.length > 0 ? (
                                        <div className="items-list">
                                            {order.items.map((item) => (
                                                <div key={`${order.id}-${item.product_id}`} className="order-item">
                                                    <div className="item-image">
                                                        {item.product_image ? (
                                                            <img 
                                                                src={`http://localhost:8080/${item.product_image}`} 
                                                                alt={item.product_name} 
                                                            />
                                                        ) : (
                                                            <div className="image-placeholder">
                                                                <FaBox />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="item-details">
                                                        <h5 className="item-name">{item.product_name}</h5>
                                                        <div className="item-specs">
                                                            <span className="quantity">Qty: {item.quantity}</span>
                                                            <span className="price">${parseFloat(item.price).toFixed(2)} each</span>
                                                        </div>
                                                    </div>
                                                    <div className="item-total">
                                                        ${(item.quantity * item.price).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-items">No items found in this order.</p>
                                    )}
                                </div>

                                <div className="order-summary">
                                    <div className="summary-row">
                                        <span>Subtotal:</span>
                                        <span>${parseFloat(order.total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Shipping:</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total:</span>
                                        <span>${parseFloat(order.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="order-actions">
                                    <button className="btn btn-outline">
                                        Track Order
                                    </button>
                                    <button className="btn btn-primary">
                                        Buy Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
