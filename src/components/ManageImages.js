import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages, uploadImage, deleteImage, getAlbums, createAlbum } from '../api/imageService';
import '../styles/ManageImages.css';

const ManageImages = () => {
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const fetchAlbums = async () => {
    const fetched = await getAlbums();
    setAlbums(fetched);
  };

  const fetchImages = async (album) => {
    try {
      setIsLoading(true);
      const fetchedImages = await getAllImages(album || currentAlbum);
      setImages(fetchedImages);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load images');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
    fetchImages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAlbumChange = (albumId) => {
    setCurrentAlbum(albumId);
    setSelectedImages([]);
    fetchImages(albumId);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    const result = await createAlbum(newAlbumName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setNewAlbumName('');
      setShowNewAlbum(false);
      await fetchAlbums();
      handleAlbumChange(result.id);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (const file of files) {
      try {
        setUploadStatus(`Uploading ${file.name}...`);
        const result = await uploadImage(file, currentAlbum);

        if (result.error) {
          setUploadStatus(`Failed to upload ${file.name}: ${result.error}`);
        } else {
          setUploadStatus(`${file.name} uploaded successfully!`);
          setTimeout(() => fetchImages(), 500);
        }
      } catch (err) {
        setUploadStatus(`Failed to upload ${file.name}: ${err.message || 'Unknown error'}`);
      }
    }
    setTimeout(() => setUploadStatus(null), 5000);
  };

  const handleDelete = async (imageId) => {
    try {
      await deleteImage(imageId, currentAlbum);
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedImages.length) return;
    try {
      for (const imageId of selectedImages) {
        await deleteImage(imageId, currentAlbum);
      }
      setImages(images.filter(img => !selectedImages.includes(img.id)));
      setSelectedImages([]);
    } catch (err) {
      setError('Failed to delete some images');
    }
  };

  const toggleImageSelection = (imageId) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h1>Manage Images</h1>
        <div className="header-links">
          <Link to="/" className="view-slideshow">Slideshow</Link>
          <Link to="/settings" className="view-slideshow">Settings</Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Album selector */}
      <div className="album-bar">
        <div className="album-tabs">
          {albums.map(album => (
            <button
              key={album.id}
              className={`album-tab ${currentAlbum === album.id ? 'active' : ''}`}
              onClick={() => handleAlbumChange(album.id)}
            >
              {album.name} ({album.imageCount})
            </button>
          ))}
          <button
            className="album-tab add-album"
            onClick={() => setShowNewAlbum(!showNewAlbum)}
          >
            + New Album
          </button>
        </div>

        {showNewAlbum && (
          <div className="new-album-form">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
              autoFocus
            />
            <button onClick={handleCreateAlbum} className="btn-primary">Create</button>
            <button onClick={() => { setShowNewAlbum(false); setNewAlbumName(''); }} className="btn-secondary">Cancel</button>
          </div>
        )}
      </div>

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
        <p className="upload-hint">Uploading to: <strong>{albums.find(a => a.id === currentAlbum)?.name || currentAlbum}</strong></p>
      </div>

      {uploadStatus && <div className="upload-status">{uploadStatus}</div>}

      {isLoading ? (
        <div className="loading">Loading images...</div>
      ) : (
        <>
          <div className="image-actions">
            <button className="select-all" onClick={toggleSelectAll}>
              {selectedImages.length === images.length && images.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            {selectedImages.length > 0 && (
              <button className="delete-selected" onClick={handleBulkDelete}>
                Delete Selected ({selectedImages.length})
              </button>
            )}
          </div>

          <div className="image-grid">
            {images.length === 0 ? (
              <p className="no-images-text">No images in this album. Upload some to get started.</p>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  className={`image-card ${selectedImages.includes(image.id) ? 'selected' : ''}`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img
                    src={image.fullUrl || image.url}
                    alt={image.name}
                    onError={(e) => {
                      e.target.src = '/logo192.png';
                      e.target.style.opacity = '0.5';
                    }}
                  />
                  <div className="image-overlay">
                    {selectedImages.includes(image.id) && (
                      <span className="checkmark">&#10003;</span>
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
