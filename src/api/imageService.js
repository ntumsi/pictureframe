import axios from 'axios';

// In production, use relative URL paths instead of hardcoded localhost
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

export const getAllImages = async () => {
  try {
    console.log('Fetching images from:', `${API_URL}/images`);
    const response = await axios.get(`${API_URL}/images`);
    
    // Safe parse if needed (in case response.data is a string)
    let parsedData;
    if (typeof response.data === 'string') {
      try {
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