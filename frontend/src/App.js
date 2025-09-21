import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/userDetails/Login/Login';
import Register from './components/userDetails/Register/Register';
import Home from './components/Home/Home';
import ProtectedRoute from './protected';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import Cart from './components/Cart/Cart';
import Orders from './components/Orders/Orders';

function App() {
  return (
    <Router>
      <div className="app-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home /> } />
            <Route path="/dashboard" element={<Dashboard /> } />
            <Route path="/cart" element={<Cart /> } />
            <Route path="/orders" element={<Orders /> } />
          </Route>
      
        </Routes>
      </div>
    </Router>
  );
}

export default App;
