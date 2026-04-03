import axios from 'axios';

// Get the API URL from environment or calculate it based on window.location
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  if (port === '3000') {
    return `${protocol}//${hostname}:5000/api`;
  }

  return `${protocol}//${window.location.host}/api`;
};

const API_URL = getApiUrl();

axios.defaults.withCredentials = false;
axios.defaults.timeout = 30000;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Helper to attach PIN header
function pinHeaders() {
  const pin = sessionStorage.getItem('pictureframe-pin') || '';
  return pin ? { 'X-Pin': pin } : {};
}

// ─── Config API ──────────────────────────────────────────────────────────────

export const getConfig = async () => {
  try {
    const response = await axios.get(`${API_URL}/config`);
    return response.data;
  } catch (error) {
    console.error('Error fetching config:', error);
    return null;
  }
};

export const updateConfig = async (updates) => {
  try {
    const response = await axios.put(`${API_URL}/config`, updates, {
      headers: { ...pinHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating config:', error);
    return { error: error.response?.data?.error || 'Failed to update config' };
  }
};

// ─── PIN API ─────────────────────────────────────────────────────────────────

export const verifyPin = async (pin) => {
  try {
    const response = await axios.post(`${API_URL}/pin/verify`, { pin });
    return response.data;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { valid: false, hasPin: true };
  }
};

export const changePin = async (newPin) => {
  try {
    const response = await axios.put(`${API_URL}/pin`, { newPin }, {
      headers: { ...pinHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error changing PIN:', error);
    return { error: error.response?.data?.error || 'Failed to change PIN' };
  }
};

// ─── Album API ───────────────────────────────────────────────────────────────

export const getAlbums = async () => {
  try {
    const response = await axios.get(`${API_URL}/albums`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
};

export const createAlbum = async (name) => {
  try {
    const response = await axios.post(`${API_URL}/albums`, { name }, {
      headers: { ...pinHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating album:', error);
    return { error: error.response?.data?.error || 'Failed to create album' };
  }
};

export const renameAlbum = async (id, name) => {
  try {
    const response = await axios.put(`${API_URL}/albums/${id}`, { name }, {
      headers: { ...pinHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error renaming album:', error);
    return { error: error.response?.data?.error || 'Failed to rename album' };
  }
};

export const deleteAlbum = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/albums/${id}`, {
      headers: { ...pinHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting album:', error);
    return { error: error.response?.data?.error || 'Failed to delete album' };
  }
};

// ─── Image API ───────────────────────────────────────────────────────────────

export const getAllImages = async (album) => {
  try {
    const timestamp = new Date().getTime();
    const params = new URLSearchParams({ _: timestamp });
    if (album) params.set('album', album);

    const url = `${API_URL}/images?${params}`;
    const response = await axios.get(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    let data = response.data;
    if (typeof data === 'string') {
      if (data.trim().startsWith('<!')) return [];
      try { data = JSON.parse(data); } catch { return []; }
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

export const uploadImage = async (file, album = 'default') => {
  try {
    const uploadUrl = `${API_URL}/upload`;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('album', album);

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest',
        },
        withCredentials: false,
        timeout: 60000
      });
      return response.data;
    } catch (axiosError) {
      console.warn('Axios upload failed, falling back to fetch:', axiosError.message);

      const timestamp = new Date().getTime();
      const fetchResponse = await fetch(uploadUrl + `?_=${timestamp}`, {
        method: 'POST',
        body: formData,
        credentials: 'omit',
        mode: 'cors',
      });

      if (!fetchResponse.ok) {
        throw new Error(`Upload failed with status: ${fetchResponse.status}`);
      }

      const responseText = await fetchResponse.text();
      try {
        return JSON.parse(responseText);
      } catch {
        return { error: 'Failed to parse response', id: 'error-' + Date.now(), name: file.name };
      }
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: error.message || 'Upload failed', id: 'error-' + Date.now(), name: file.name };
  }
};

export const deleteImage = async (imageId, album) => {
  try {
    const params = album ? `?album=${album}` : '';
    const response = await axios.delete(`${API_URL}/images/${imageId}${params}`);

    let data = response.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return { success: false, error: 'Failed to parse response' }; }
    }
    return data;
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};
