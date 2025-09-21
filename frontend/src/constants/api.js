
// Base URL configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:10000/api'
);

// Helper function to handle API requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies/sessions
    });

    // Log response for debugging
    console.log(`API Response [${response.status}]: ${url}`, response);

    // Handle non-successful responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Invalid JSON response' };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null; // or return response.text() if you expect non-JSON responses
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', {
      url,
      error: error.message,
      status: error.status,
      data: error.data
    });
    
    // Improve error message for CORS issues
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
};