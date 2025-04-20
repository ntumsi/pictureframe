import axios from 'axios';

// In production, use relative URL paths instead of hardcoded localhost
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

export const getAllImages = async () => {
  try {
    console.log('Fetching images from:', `${API_URL}/images`);
    const response = await axios.get(`${API_URL}/images`);
    // Ensure we always return an array
    const images = Array.isArray(response.data) ? response.data : [];
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
    
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (imageId) => {
  try {
    const response = await axios.delete(`${API_URL}/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};