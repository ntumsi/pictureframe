import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages, uploadImage, deleteImage } from '../api/imageService';
import '../styles/ManageImages.css';

const ManageImages = () => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch all images
  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const fetchedImages = await getAllImages();
      setImages(fetchedImages);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load images');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  // Handle file upload
  const handleFiles = async (files) => {
    for (const file of files) {
      try {
        setUploadStatus(`Uploading ${file.name}...`);
        await uploadImage(file);
        setUploadStatus(`${file.name} uploaded successfully!`);
        fetchImages(); // Refresh images list
      } catch (err) {
        setUploadStatus(`Failed to upload ${file.name}`);
      }
    }
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setUploadStatus(null);
    }, 3000);
  };

  // Handle image deletion
  const handleDelete = async (imageId) => {
    try {
      await deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedImages.length) return;
    
    try {
      for (const imageId of selectedImages) {
        await deleteImage(imageId);
      }
      
      setImages(images.filter(img => !selectedImages.includes(img.id)));
      setSelectedImages([]);
    } catch (err) {
      setError('Failed to delete some images');
    }
  };

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  // Toggle select all images
  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h1>Manage Images</h1>
        <Link to="/" className="view-slideshow">View Slideshow</Link>
      </div>

      {error && <div className="error">{error}</div>}
      
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag and drop images here</p>
        <p>OR</p>
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload" className="upload-button">
          Select Files
        </label>
      </div>

      {uploadStatus && <div className="upload-status">{uploadStatus}</div>}

      {isLoading ? (
        <div className="loading">Loading images...</div>
      ) : (
        <>
          <div className="image-actions">
            <button 
              className="select-all"
              onClick={toggleSelectAll}
            >
              {selectedImages.length === images.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedImages.length > 0 && (
              <button 
                className="delete-selected"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedImages.length})
              </button>
            )}
          </div>

          <div className="image-grid">
            {images.length === 0 ? (
              <p>No images found. Upload some images to get started.</p>
            ) : (
              images.map((image) => (
                <div 
                  key={image.id} 
                  className={`image-card ${selectedImages.includes(image.id) ? 'selected' : ''}`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img 
                    src={image.url} 
                    alt={image.name} 
                    onError={(e) => {
                      console.error('Error loading image in ManageImages:', e, image.url);
                      console.log('Failed URL:', image.url);
                    }}
                  />
                  <div className="image-overlay">
                    {selectedImages.includes(image.id) && (
                      <span className="checkmark">✓</span>
                    )}
                    <button 
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageImages;