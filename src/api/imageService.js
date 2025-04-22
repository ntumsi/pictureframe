import axios from 'axios';

// Determine the appropriate API URL dynamically
const getApiUrl = () => {
  // In production mode, always use the same host as the page
  // This ensures it works correctly regardless of where it's hosted
  const host = window.location.protocol + '//' + window.location.host;
  return `${host}/api`;
};

const API_URL = getApiUrl();

console.log('API Service initialized with URL:', API_URL);
console.log('Current location:', window.location.href);
console.log('Environment:', process.env.NODE_ENV);

export const getAllImages = async () => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${API_URL}/images?_=${timestamp}`;
    console.log('Fetching images from:', url);
    
    // Skip custom headers to avoid CORS issues
    const response = await axios.get(url, { 
      withCredentials: false
    });
    
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
    
    // Only using minimal headers to avoid CORS issues
    const response = await axios.post(`${API_URL}/upload`, formData);
    
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