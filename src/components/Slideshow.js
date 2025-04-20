import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages } from '../api/imageService';
import '../styles/Slideshow.css';

const Slideshow = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);

  // Load images
  useEffect(() => {
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

    fetchImages();
    
    // Refresh images every minute
    const interval = setInterval(fetchImages, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance slideshow
  useEffect(() => {
    if (images.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 10000); // Change image every 10 seconds
    
    return () => clearInterval(interval);
  }, [images]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hide/show controls on mouse movement
  useEffect(() => {
    let timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, toggleFullscreen]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (images.length === 0) {
    return (
      <div className="no-images">
        <p>No images found</p>
        <Link to="/manage" className="manage-link">Add Images</Link>
      </div>
    );
  }

  return (
    <div className="slideshow-container">
      <div className="slideshow">
        {images.length > 0 && (
          <img 
            src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${images[currentIndex].url}`} 
            alt={images[currentIndex].name} 
            className="slideshow-image"
          />
        )}
      </div>
      
      {showControls && (
        <div className="controls">
          <button onClick={goToPrevious} className="nav-button prev">❮</button>
          <button onClick={goToNext} className="nav-button next">❯</button>
          <div className="bottom-controls">
            <button onClick={toggleFullscreen} className="fullscreen-button">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <Link to="/manage" className="manage-link">Manage Images</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slideshow;