import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  console.log(user);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    const handleStorageUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser && updatedUser._id === user?._id) {
        setFormData({
          username: updatedUser.username || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          image: updatedUser.image || '',
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [user?._id]); 

 
  useEffect(() => {
    if (user) {
      
      if (formData.username !== user.username || 
          formData.email !== user.email || 
          formData.phone !== user.phone || 
          formData.address !== user.address || 
          formData.image !== user.image) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          image: user.image || ''
        });
      }
    }
  }, [user?.username, user?.email, user?.phone, user?.address, user?.image, isEditing]); 

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [name]: reader.result,
          imageFile: file  
        }));
      };
      
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUpdateProfile = async (e, id) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      formDataToSend.append('username', formData.username || '');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('address', formData.address || '');
      
      // Only append image if it's a new file
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      console.log('Sending PATCH request to update profile...');
      console.log('Form data:', Object.fromEntries(formDataToSend.entries()));

      const response = await axios.patch(
        `http://localhost:8080/api/register/${id}`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Update response:', response.data);

      if (response.data.success) {
        const updatedUser = { 
          ...user,
          ...formData,
          // Only update image if we have a new one
          ...(formData.image && { image: formData.image })
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccess('Profile updated successfully!');
        
        setTimeout(() => {
          setIsEditing(false);
          setSuccess('');
          window.dispatchEvent(new Event('storage'));
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update profile. Please try again.';
      setError(errorMessage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const handleEditProfile = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');


  };

  const handleMyOrders = () => {
    navigate('/orders');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          Shanture
        </Link>
        
        <div className="menu-icon" onClick={toggleMenu}>
          <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li><Link to="/dashboard" className="nav-links" onClick={toggleMenu}>Dashboard</Link></li>
          <li><Link to="/cart" className="nav-links" onClick={toggleMenu}>Cart</Link></li>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={toggleMenu}>
              Home
            </Link>
          </li>
          
          {user ? (
            <li className="nav-item" ref={dropdownRef} style={{ position: 'relative' }}>
              {/* <div 
                className="nav-profile"   
              >
                {user?.username?.[0]?.toUpperCase()}
              </div> */}

                    <div className="profile-avatar"  onClick={toggleDropdown}
                            style={{ cursor: 'pointer'}}>
                              {/* <img 
                                src={
                                  `http://localhost:8080${formData.image}`} 
                                alt="Profile" 
                                className="profile-image"
                              /> */}
                               <img 
                                  src={formData.image?.startsWith('data:image') ? formData.image : 
                                    `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${formData.image}`} 
                                  alt="Preview" />
                    </div>
              
              {showDropdown && (
                <div className="profile-dropdown">
                  {isEditing ? (
                    <form onSubmit={(e) => handleUpdateProfile(e, user.id)} className="profile-form" style={{height:'100vh', overflow:'auto',scrollbarWidth:'none',overflowX:'hidden',overflowY:'auto'}}>
                      <h3>Edit Profile</h3>
                      {error && <div className="error-message">{error}</div>}
                      {success && <div className="success-message">{success}</div>}
                      <div className="form-group">
                        <div className="image-upload-container">
                          <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="file-input"
                            id="profile-image-upload"
                          />
                          {formData.image ? (
                            <div className="image-preview-wrapper">
                              <label htmlFor="profile-image-upload" className="image-preview-label">
                                <img 
                                  src={formData.image?.startsWith('data:image') ? formData.image : 
                                    `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${formData.image}`} 
                                  alt="Preview" 
                                  className="preview-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="image-hover-overlay">
                                  <span>Change Image</span>
                                </div>
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="profile-image-upload" className="file-upload-label">
                              Upload Image
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                    

                   
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary" >
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setIsEditing(false);
                            setError('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-info">
                      <div className="profile-header">
                        <div className="profile-avatar" data-initial={user?.username?.[0]?.toUpperCase()}>
                          {user?.image ? (
                           
                            <img
                                src={
                                    user?.image?.startsWith("http")
                                    ? user.image
                                    : `${process.env.REACT_APP_API_URL || "http://localhost:8080"}${user.image}`
                                }
                                alt="profile"
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.textContent =
                                    user?.username?.[0]?.toUpperCase() || "?";
                                }}
                                />
                          ) : (
                            user?.username?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="profile-details">
                          <h4>{user.username}</h4>
                          <p>{user.email}</p>
                        </div>
                      </div>
                      <div className="profile-actions">
                        <button 
                          className="btn btn-edit"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </button>
                        <button 
                          className="btn btn-edit"
                          onClick={handleMyOrders}
                        >
                          My Orders
                        </button>
                        <button 
                          className="btn btn-logout"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links" onClick={toggleMenu}>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links nav-button" onClick={toggleMenu}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;