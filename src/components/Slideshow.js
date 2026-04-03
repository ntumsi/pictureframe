import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages, getConfig } from '../api/imageService';
import Calendar from './Calendar';
import '../styles/Slideshow.css';

const Slideshow = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [transition, setTransition] = useState('fade');
  const [transitioning, setTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [config, setConfig] = useState(null);
  const [orientation, setOrientation] = useState('landscape');
  const intervalRef = useRef(null);

  // Load config
  useEffect(() => {
    const fetchConfig = async () => {
      const cfg = await getConfig();
      if (cfg) setConfig(cfg);
    };
    fetchConfig();
    const configRefresh = setInterval(fetchConfig, 10000);
    return () => clearInterval(configRefresh);
  }, []);

  const slideshowInterval = config?.slideshow?.interval || 10;
  const transitionType = config?.slideshow?.transition || 'fade';
  const shuffleMode = config?.slideshow?.shuffle || false;
  const showCalendar = config?.slideshow?.showCalendar !== false;
  const activeAlbum = config?.activeAlbum || 'all';
  const background = config?.slideshow?.background || 'blur';
  const backgroundColor = config?.slideshow?.backgroundColor || '#000000';
  const frameStyle = config?.slideshow?.frame || 'none';
  const showMat = config?.slideshow?.mat || false;
  const matColor = config?.slideshow?.matColor || '#ffffff';

  // Load images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        let fetchedImages = await getAllImages(activeAlbum === 'all' ? undefined : activeAlbum);

        if (shuffleMode && fetchedImages.length > 1) {
          fetchedImages = [...fetchedImages].sort(() => Math.random() - 0.5);
        }

        setImages(fetchedImages);
        setIsLoading(false);
      } catch (err) {
        console.error('Slideshow: Error fetching images:', err);
        setError('Failed to load images');
        setIsLoading(false);
      }
    };

    fetchImages();
    const refresh = setInterval(fetchImages, 60000);
    return () => clearInterval(refresh);
  }, [activeAlbum, shuffleMode]);

  // Detect image orientation on load
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth >= naturalHeight) {
      setOrientation('landscape');
    } else {
      setOrientation('portrait');
    }
  };

  // Advance to next/prev with transition
  const advance = useCallback((direction = 'next') => {
    if (images.length === 0) return;

    setSlideDirection(direction);
    setTransitioning(true);

    setTimeout(() => {
      setCurrentIndex(prev => {
        if (direction === 'next') return (prev + 1) % images.length;
        return (prev - 1 + images.length) % images.length;
      });
      setTimeout(() => setTransitioning(false), 50);
    }, transitionType === 'none' ? 0 : 400);
  }, [images.length, transitionType]);

  // Auto-advance slideshow
  useEffect(() => {
    if (images.length === 0) return;

    intervalRef.current = setInterval(() => {
      advance('next');
    }, slideshowInterval * 1000);

    return () => clearInterval(intervalRef.current);
  }, [images, slideshowInterval, advance]);

  useEffect(() => {
    setTransition(transitionType);
  }, [transitionType]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') advance('next');
      else if (e.key === 'ArrowLeft') advance('prev');
      else if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance, toggleFullscreen]);

  const goToNext = () => advance('next');
  const goToPrevious = () => advance('prev');

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

  const currentImage = images[currentIndex];
  const imageSrc = currentImage.fullUrl || currentImage.url;

  const transitionClass = transitioning
    ? `transition-${transition}-out ${slideDirection}`
    : `transition-${transition}-in ${slideDirection}`;

  // Background style
  const containerStyle = {};
  const bgColors = { black: '#000000', 'dark-gray': '#1a1a1a', white: '#f5f5f5' };
  if (bgColors[background]) {
    containerStyle.backgroundColor = bgColors[background];
  } else if (background === 'color') {
    containerStyle.backgroundColor = backgroundColor;
  }

  const hasFrame = frameStyle && frameStyle !== 'none';
  const frameClass = hasFrame ? `frame-${frameStyle}` : 'frame-none';
  const orientClass = `orient-${orientation}`;

  const imgProps = {
    src: imageSrc,
    alt: currentImage.name,
    className: `slideshow-image ${transition !== 'none' ? transitionClass : ''}`,
    onLoad: handleImageLoad,
    onError: () => {
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 2000);
    },
  };

  return (
    <div className="slideshow-container" style={containerStyle}>
      {background === 'blur' && (
        <div
          className="slideshow-bg-blur"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      )}

      <div className="slideshow">
        <div className={`frame-wrapper ${frameClass} ${orientClass}`}>
          {showMat && hasFrame ? (
            <div className="frame-mat" style={{ backgroundColor: matColor }}>
              <img {...imgProps} />
            </div>
          ) : (
            <img {...imgProps} />
          )}
        </div>

        {showCalendar && <Calendar />}
      </div>

      {showControls && (
        <div className="controls">
          <button onClick={goToPrevious} className="nav-button prev">&#10094;</button>
          <button onClick={goToNext} className="nav-button next">&#10095;</button>
          <div className="bottom-controls">
            <button onClick={toggleFullscreen} className="fullscreen-button">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <Link to="/manage" className="manage-link">Manage</Link>
            <Link to="/settings" className="manage-link">Settings</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slideshow;
