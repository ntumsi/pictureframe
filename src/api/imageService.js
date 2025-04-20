import axios from 'axios';

// IMPORTANT: We're forcing the API_URL to ALWAYS use the backend server directly
// This ensures we're always hitting the Express API server directly and not going through the static server
// or getting confused by client-side routing

// Hardcode the API_URL to always use port 5000
const API_URL = 'http://localhost:5000/api';

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
    console.log('Uploading image to:', `${API_URL}/upload`);
    console.log('File being uploaded:', file.name, file.type, file.size);
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Safe parse if needed
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse upload response data:', e);
        parsedData = { error: 'Failed to parse response' };
      }
    } else {
      parsedData = response.data;
    }
    
    console.log('Upload response:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
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