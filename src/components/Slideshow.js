import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages } from '../api/imageService';
import Calendar from './Calendar';
import '../styles/Slideshow.css';

const Slideshow = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const minSwipeDistance = 50; // Minimum distance required for a swipe

  // Load images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const fetchedImages = await getAllImages();
        setImages(fetchedImages);
        setIsLoading(false);
      } catch (err) {
        console.error('Slideshow: Error fetching images:', err);
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
  
  // Preload next and previous images to improve performance
  useEffect(() => {
    if (images.length <= 1) return;
    
    // Calculate the next and previous indices
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    
    // Get the image URLs
    const nextImageUrl = images[nextIndex].isOptimized 
      ? images[nextIndex].url 
      : (images[nextIndex].fullUrl || images[nextIndex].url);
      
    const prevImageUrl = images[prevIndex].isOptimized 
      ? images[prevIndex].url 
      : (images[prevIndex].fullUrl || images[prevIndex].url);
    
    // Create new Image objects to preload the images
    const preloadNext = new Image();
    preloadNext.src = nextImageUrl;
    
    const preloadPrev = new Image();
    preloadPrev.src = prevImageUrl;
    
    // Store preloaded images in state
    setPreloadedImages(prev => ({
      ...prev,
      [nextIndex]: true,
      [prevIndex]: true
    }));
    
    console.log('Preloaded images for indices:', nextIndex, prevIndex);
    
  }, [currentIndex, images]);

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
  
  // Touch event handlers for swipe with visual feedback
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    
    // Calculate current swipe distance to show direction indicator
    const currentDistance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(currentDistance) > minSwipeDistance / 2) {
      setSwipeDirection(currentDistance > 0 ? 'next' : 'prev');
    } else {
      setSwipeDirection(null);
    }
  };
  
  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(distance) > minSwipeDistance) {
      // Right to left swipe (next)
      if (distance > 0) {
        setSwipeDirection('next');
        goToNext();
      } 
      // Left to right swipe (previous)
      else {
        setSwipeDirection('prev');
        goToPrevious();
      }
      
      // Show swipe indicator briefly
      setTimeout(() => {
        setSwipeDirection(null);
      }, 500);
    } else {
      setSwipeDirection(null);
    }
    
    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
    setIsSwiping(false);
  };

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
    <div 
      className="slideshow-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="slideshow">
        {images.length > 0 && (
          <>
            <img 
              src={images[currentIndex].isOptimized ? images[currentIndex].url : (images[currentIndex].fullUrl || images[currentIndex].url)} 
              alt={images[currentIndex].name} 
              className="slideshow-image"
              loading="eager" /* Ensure current image loads immediately */
              decoding="async" /* Allow browser to decode image asynchronously */
              onError={(e) => {
                console.error('Image loading error:', e);
                console.log('Failed image source:', e.target.src);
                // Try to recover by advancing to the next image after a short delay
                setTimeout(() => {
                  setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
                }, 2000);
              }}
              draggable="false" /* Prevent image dragging on mobile */
            />
          </>
        )}
        
        {/* Swipe direction indicator */}
        {swipeDirection === 'next' && (
          <div className="swipe-indicator">
            ❯
          </div>
        )}
        {swipeDirection === 'prev' && (
          <div className="swipe-indicator">
            ❮
          </div>
        )}
        
        {/* Calendar overlay in the lower right corner */}
        <Calendar />
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