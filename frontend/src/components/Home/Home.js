import "./Home.css"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../constants/api';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/products`);
                console.log('API Response:', response); // Debug log
                
                // Check if response.data exists and has a data property (array of products)
                const productsData = response.data?.data || [];
                
                if (!Array.isArray(productsData)) {
                    console.error('Expected array of products but got:', productsData);
                    setProducts([]);
                    setQuantities({});
                    return;
                }
                
                setProducts(productsData);
                
                // Initialize quantities for each product
                const initialQuantities = {};
                productsData.forEach(product => {
                    if (product && product.id) {
                        initialQuantities[product.id] = 1; // Start with quantity 1 for each product
                    }
                });
                setQuantities(initialQuantities);
            } catch (error) {
                console.error('Error fetching products:', error);
                // Set empty states on error
                setProducts([]);
                setQuantities({});
                toast.error('Failed to load products');
            }
        };
        
        fetchProducts();
    }, []);

    const handleQuantityChange = (productId, newQuantity) => {
        // Ensure quantity is at least 1 and at most 10
        const validatedQuantity = Math.max(1, Math.min(10, newQuantity));
        setQuantities(prev => ({
            ...prev,
            [productId]: validatedQuantity
        }));
    };

    const handleAddToCart = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please log in to add items to cart');
                return;
            }

            const quantity = quantities[productId] || 1;
            
            const response = await axios.post(`${API_BASE_URL}/cart/${productId}`,
                 { quantity },
                 {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                 });


            if (response && response.data) {
                toast.success(`Added ${quantity} item(s) to cart!`, {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                
                // Reset quantity to 1 after adding to cart
                setQuantities(prev => ({
                    ...prev,
                    [productId]: 1
                }));
            }
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add item to cart';
            toast.error(errorMessage);
        }
    };

    console.log(products);




    return (
        <div className="home-container">
            <h1>Home</h1>
            <div className="products">
                {products?.map((product, index) => (
                    <div key={index} className="product">
                        <img src={product.image} alt={product.name} />
                        <div className="product-content">
                            <h2>{product.name}</h2>
                            <p className="description">{product.description}</p>
                            <p className="price">${product.price.toFixed(2)}</p>
                           
                        </div>
                        <div className="product-actions">
                            <div className="quantity-controls">
                                <button 
                                    onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 1) - 1)}
                                    disabled={(quantities[product.id] || 1) <= 1}
                                >
                                    -
                                </button>
                                <span>{quantities[product.id] || 1}</span>
                                <button 
                                    onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 1) + 1)}
                                    disabled={(quantities[product.id] || 1) >= 10}
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                className="add-to-cart-btn"
                                onClick={() => handleAddToCart(product.id)}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
           
        </div>
    );
};  

export default Home;
