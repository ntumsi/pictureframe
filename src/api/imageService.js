import axios from 'axios';

// Determine the appropriate API URL dynamically
const getApiUrl = () => {
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
    
    // Properly handle the request with transformResponse to avoid automatic parsing
    const response = await axios.get(url, { 
      withCredentials: false,
      transformResponse: [(data) => {
        // Return the data as-is, don't let axios attempt to parse it
        return data;
      }]
    });
    
    // Log the raw response for debugging
    console.log('Raw response headers:', response.headers);
    console.log('Raw response type:', typeof response.data);
    
    // Safe parse if needed (in case response.data is a string)
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        // Check if it looks like HTML
        if (response.data.trim().startsWith('<!DOCTYPE') || 
            response.data.trim().startsWith('<!doctype') || 
            response.data.trim().startsWith('<!')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 200));
          console.log('Full HTML response length:', response.data.length);
          return [];
        }
        
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse response data:', e);
        console.error('Response content (first 500 chars):', response.data.substring(0, 500));
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
    
    const formData = new FormData();
    formData.append('image', file);
    
    // Set proper headers for multipart form data but let the browser set the boundary
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Don't transform the response - handle it directly
      transformResponse: [(data) => {
        // Return the data as-is
        return data;
      }]
    });
    
    // Safely handle the response
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        // Check if the response looks like HTML
        if (response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<!doctype')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 200));
          return { error: 'Received HTML response, API endpoint may be incorrect' };
        }
        
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse upload response data:', e);
        console.error('Response content:', response.data.substring(0, 500));
        parsedData = { error: 'Failed to parse response' };
      }
    } else {
      parsedData = response.data;
    }
    
    console.log('Upload response:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error response data:', 
        typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : error.response.data
      );
    }
    return { error: 'Upload failed: ' + (error.message || 'Unknown error') };
  }
};

export const deleteImage = async (imageId) => {
  try {
    console.log('Deleting image:', imageId);
    const deleteUrl = `${API_URL}/images/${imageId}`;
    console.log('Delete URL:', deleteUrl);
    
    const response = await axios.delete(deleteUrl, {
      transformResponse: [(data) => {
        // Return the data as-is
        return data;
      }]
    });
    
    // Safe parse if needed
    let parsedData;
    if (typeof response.data === 'string') {
      try {
        // Check if the response looks like HTML
        if (response.data.trim().startsWith('<!DOCTYPE') || 
            response.data.trim().startsWith('<!doctype') || 
            response.data.trim().startsWith('<!')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 200));
          return { success: false, error: 'Received HTML response, API endpoint may be incorrect' };
        }
        
        parsedData = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse delete response data:', e);
        console.error('Response content:', response.data.substring(0, 500));
        parsedData = { success: false, error: 'Failed to parse response' };
      }
    } else {
      parsedData = response.data;
    }
    
    console.log('Delete response:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error deleting image:', error);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error response data:', 
        typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : error.response.data
      );
    }
    return { success: false, error: 'Delete failed: ' + (error.message || 'Unknown error') };
  }
};