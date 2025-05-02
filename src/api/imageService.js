import axios from 'axios';

// Get the API URL from environment or calculate it based on window.location
const getApiUrl = () => {
  // First priority: environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Second priority: derive from current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Case 1: Development with React server on port 3000
  if (port === '3000') {
    // When using the development server or serve in production, 
    // we need to connect to the Express API server on port 5000
    // Use the same hostname but different port
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Case 2: Production with Express server
  // Use the same host as the page (the Express server serves both API and static content)
  const host = protocol + '//' + window.location.host;
  return `${host}/api`;
};

// Use consistent API URL across environments
const API_URL = getApiUrl();

// Configure axios defaults
axios.defaults.withCredentials = false; // Disable credentials to avoid CORS issues
axios.defaults.timeout = 30000; // 30 second timeout
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    console.error('Response error:', error.message);
    console.error('Failed URL:', error.config?.url);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received');
    }
    
    return Promise.reject(error);
  }
);

console.log('API Service initialized with URL:', API_URL);
console.log('Current location:', window.location.href);
console.log('Environment:', process.env.NODE_ENV);

export const getAllImages = async () => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${API_URL}/images?_=${timestamp}`;
    console.log('Fetching images from:', url);
    
    // Add debug headers
    const headers = {
      'X-Client-Debug': 'true',
      'X-Timestamp': timestamp.toString(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    const response = await axios.get(url, { headers });
    
    // Log the raw response for debugging
    console.log('Raw response headers:', response.headers);
    console.log('Raw response type:', typeof response.data);
    
    // Safe parse if needed (in case response.data is a string)
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        // Check if it looks like HTML
        if (response.data.trim().startsWith('<!')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 100));
          return [];
        }
        
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse response data:', e);
        parsedData = [];
      }
    } else {
      parsedData = response.data;
    }
    
    // Ensure we always return an array
    const images = Array.isArray(parsedData) ? parsedData : [];
    console.log('Received images:', images.length, images);
    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error response data:', 
        typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : error.response.data
      );
    }
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

export const uploadImage = async (file) => {
  try {
    const uploadUrl = `${API_URL}/upload`;
    console.log('Uploading image to:', uploadUrl);
    console.log('File being uploaded:', file.name, file.type, file.size);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Use fetch API instead of axios for file uploads
    console.log('Using fetch API for upload');
    const fetchResponse = await fetch(uploadUrl + `?_=${timestamp}`, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin', // Use same-origin to avoid CORS issues
      mode: 'cors',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Debug': 'true',
        'X-Timestamp': timestamp.toString()
      }
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`Upload failed with status: ${fetchResponse.status}`);
    }
    
    const responseText = await fetchResponse.text();
    console.log('Raw upload response:', responseText);
    
    // Parse response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse upload response:', e);
      console.error('Response text:', responseText.substring(0, 200));
      return { 
        error: 'Failed to parse response',
        id: 'error-' + Date.now(),
        name: file.name,
        path: '#error',
        url: '#error'
      };
    }
    
    console.log('Parsed upload response:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Return a usable object instead of throwing
    return { 
      error: error.message || 'Upload failed',
      id: 'error-' + Date.now(),
      name: file.name,
      path: '#error',
      url: '#error'
    };
  }
};

export const deleteImage = async (imageId) => {
  try {
    console.log('Deleting image:', imageId);
    const response = await axios.delete(`${API_URL}/images/${imageId}`);
    
    // Safe parse if needed
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse delete response data:', e);
        parsedData = { success: false, error: 'Failed to parse response' };
      }
    } else {
      parsedData = response.data;
    }
    
    console.log('Delete response:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};