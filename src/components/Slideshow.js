import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllImages, getConfig } from '../api/imageService';
import Calendar from './Calendar';
import '../styles/Slideshow.css';

const Slideshow = () => {
  const [images, setImages] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [orientation, setOrientation] = useState('landscape');

  // Two-layer crossfade: layers[0] is bottom, layers[1] is top
  // activeLayer is 0 or 1 — whichever is currently visible (opacity 1)
  const [layers, setLayers] = useState([null, null]); // each is an image src string
  const [activeLayer, setActiveLayer] = useState(0);
  const currentIndexRef = useRef(0);
  const animatingRef = useRef(false);
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
  const transitionMs = transitionType === 'none' ? 0 : 800;

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

  // Initialize first image into the active layer
  useEffect(() => {
    if (images.length > 0 && layers[0] === null && layers[1] === null) {
      const src = images[0].fullUrl || images[0].url;
      setLayers([src, null]);
      setActiveLayer(0);
      currentIndexRef.current = 0;
    }
  }, [images, layers]);

  // Preload next image in background
  useEffect(() => {
    if (images.length < 2) return;
    const nextIdx = (currentIndexRef.current + 1) % images.length;
    const img = new window.Image();
    img.src = images[nextIdx].fullUrl || images[nextIdx].url;
  }, [images, activeLayer]); // re-preload after each transition

  // Detect image orientation
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setOrientation(naturalWidth >= naturalHeight ? 'landscape' : 'portrait');
  };

  // Core transition: load the next image into the inactive layer, then flip opacity
  const advance = useCallback((direction = 'next') => {
    if (images.length < 2 || animatingRef.current) return;
    animatingRef.current = true;

    const nextIdx = direction === 'next'
      ? (currentIndexRef.current + 1) % images.length
      : (currentIndexRef.current - 1 + images.length) % images.length;

    const nextSrc = images[nextIdx].fullUrl || images[nextIdx].url;
    const inactiveLayer = activeLayer === 0 ? 1 : 0;

    // Step 1: Load the next image into the hidden (inactive) layer
    const preload = new window.Image();
    preload.onload = () => {
      // Set the inactive layer's src
      setLayers(prev => {
        const updated = [...prev];
        updated[inactiveLayer] = nextSrc;
        return updated;
      });

      // Step 2: After a single frame (to let the browser paint the hidden layer),
      // flip activeLayer so CSS transitions kick in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActiveLayer(inactiveLayer);
          currentIndexRef.current = nextIdx;

          // Step 3: After the transition completes, unlock
          setTimeout(() => {
            animatingRef.current = false;
          }, transitionMs + 50);
        });
      });
    };
    preload.onerror = () => {
      // Skip broken images
      currentIndexRef.current = nextIdx;
      animatingRef.current = false;
    };
    preload.src = nextSrc;
  }, [images, activeLayer, transitionMs]);

  // Auto-advance
  useEffect(() => {
    if (images.length < 2) return;

    intervalRef.current = setInterval(() => {
      advance('next');
    }, slideshowInterval * 1000);

    return () => clearInterval(intervalRef.current);
  }, [images, slideshowInterval, advance]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useEffect(() => {
    let timeout;
    const h = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    document.addEventListener('mousemove', h);
    return () => { document.removeEventListener('mousemove', h); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') advance('next');
      else if (e.key === 'ArrowLeft') advance('prev');
      else if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance, toggleFullscreen]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (images.length === 0) {
    return (
      <div className="no-images">
        <p>No images found</p>
        <Link to="/manage" className="manage-link">Add Images</Link>
      </div>
    );
  }

  // Background
  const containerStyle = {};
  const bgColors = { black: '#000000', 'dark-gray': '#1a1a1a', white: '#f5f5f5' };
  if (bgColors[background]) containerStyle.backgroundColor = bgColors[background];
  else if (background === 'color') containerStyle.backgroundColor = backgroundColor;

  const hasFrame = frameStyle && frameStyle !== 'none';
  const frameClass = hasFrame ? `frame-${frameStyle}` : 'frame-none';
  const orientClass = `orient-${orientation}`;
  const activeSrc = layers[activeLayer];

  // Transition CSS custom property
  const transitionVar = { '--transition-ms': `${transitionMs}ms` };

  const renderLayers = () => (
    <div className={`crossfade-container cf-type-${transitionType}`} style={transitionVar}>
      {[0, 1].map(i => (
        <div
          key={i}
          className={`cf-layer ${activeLayer === i ? 'cf-active' : 'cf-inactive'}`}
        >
          {layers[i] && (
            <img
              src={layers[i]}
              alt=""
              className="slideshow-image"
              onLoad={activeLayer === i ? handleImageLoad : undefined}
              draggable={false}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="slideshow-container" style={containerStyle}>
      {background === 'blur' && (
        <div
          className="slideshow-bg-blur"
          style={{ backgroundImage: `url(${activeSrc})` }}
        />
      )}

      <div className="slideshow">
        <div className={`frame-wrapper ${frameClass} ${orientClass}`}>
          {showMat && hasFrame ? (
            <div className="frame-mat" style={{ backgroundColor: matColor }}>
              {renderLayers()}
            </div>
          ) : (
            renderLayers()
          )}
        </div>
        {showCalendar && <Calendar />}
      </div>

      {showControls && (
        <div className="controls">
          <button onClick={() => advance('prev')} className="nav-button prev">&#10094;</button>
          <button onClick={() => advance('next')} className="nav-button next">&#10095;</button>
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
