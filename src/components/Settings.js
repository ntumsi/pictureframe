import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConfig, updateConfig, changePin, getAlbums, renameAlbum, deleteAlbum } from '../api/imageService';
import '../styles/Settings.css';

const FRAME_OPTIONS = [
  { value: 'none', label: 'No Frame' },
  { value: 'classic-wood', label: 'Classic Wood' },
  { value: 'dark-wood', label: 'Dark Wood' },
  { value: 'ornate-gold', label: 'Ornate Gold' },
  { value: 'white-gallery', label: 'White Gallery' },
  { value: 'shadow-box', label: 'Shadow Box' },
  { value: 'rustic', label: 'Rustic' },
];

const BACKGROUND_OPTIONS = [
  { value: 'blur', label: 'Blurred Photo' },
  { value: 'black', label: 'Black' },
  { value: 'dark-gray', label: 'Dark Gray' },
  { value: 'white', label: 'White' },
  { value: 'color', label: 'Custom Color' },
];

const BACKGROUND_COLORS = {
  black: '#000000',
  'dark-gray': '#1a1a1a',
  white: '#f5f5f5',
};

const MAT_COLORS = [
  { value: '#ffffff', label: 'White' },
  { value: '#f5f0e8', label: 'Cream' },
  { value: '#e8e0d0', label: 'Ivory' },
  { value: '#d4c5a9', label: 'Linen' },
  { value: '#2c2c2c', label: 'Charcoal' },
  { value: '#000000', label: 'Black' },
];

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editName, setEditName] = useState('');

  // PIN fields
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const load = async () => {
      const [cfg, albs] = await Promise.all([getConfig(), getAlbums()]);
      if (cfg) setConfig(cfg);
      setAlbums(albs);
      setIsLoading(false);
    };
    load();
  }, []);

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSlideshowChange = async (key, value) => {
    const updated = { slideshow: { [key]: value } };
    const result = await updateConfig(updated);
    if (result.error) {
      showMessage(result.error, true);
    } else {
      setConfig(result);
      showMessage('Settings saved');
    }
  };

  const handleBackgroundChange = async (bg) => {
    const updates = { background: bg };
    if (BACKGROUND_COLORS[bg]) {
      updates.backgroundColor = BACKGROUND_COLORS[bg];
    }
    const result = await updateConfig({ slideshow: updates });
    if (result.error) {
      showMessage(result.error, true);
    } else {
      setConfig(result);
      showMessage('Settings saved');
    }
  };

  const handleActiveAlbumChange = async (albumId) => {
    const result = await updateConfig({ activeAlbum: albumId });
    if (result.error) {
      showMessage(result.error, true);
    } else {
      setConfig(result);
      showMessage('Active album updated');
    }
  };

  const handlePinChange = async () => {
    if (newPin !== confirmPin) {
      showMessage('PINs do not match', true);
      return;
    }
    const result = await changePin(newPin);
    if (result.error) {
      showMessage(result.error, true);
    } else {
      if (newPin) {
        sessionStorage.setItem('pictureframe-pin', newPin);
      } else {
        sessionStorage.removeItem('pictureframe-pin');
      }
      showMessage(newPin ? 'PIN updated' : 'PIN removed');
      setNewPin('');
      setConfirmPin('');
      const cfg = await getConfig();
      if (cfg) setConfig(cfg);
    }
  };

  const handleRenameAlbum = async (id) => {
    if (!editName.trim()) return;
    const result = await renameAlbum(id, editName.trim());
    if (result.error) {
      showMessage(result.error, true);
    } else {
      setAlbums(albums.map(a => a.id === id ? { ...a, name: editName.trim() } : a));
      setEditingAlbum(null);
      showMessage('Album renamed');
    }
  };

  const handleDeleteAlbum = async (id, name) => {
    if (!window.confirm(`Delete album "${name}"? Images will be moved to All Photos.`)) return;
    const result = await deleteAlbum(id);
    if (result.error) {
      showMessage(result.error, true);
    } else {
      setAlbums(albums.filter(a => a.id !== id));
      if (config?.activeAlbum === id) {
        const cfg = await getConfig();
        if (cfg) setConfig(cfg);
      }
      showMessage('Album deleted');
    }
  };

  if (isLoading) {
    return <div className="settings-container"><div className="loading">Loading...</div></div>;
  }

  const currentFrame = config?.slideshow?.frame || 'none';
  const currentBg = config?.slideshow?.background || 'blur';
  const currentMat = config?.slideshow?.mat || false;
  const currentMatColor = config?.slideshow?.matColor || '#ffffff';

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <div className="header-links">
          <Link to="/" className="btn-link">Slideshow</Link>
          <Link to="/manage" className="btn-link">Manage</Link>
        </div>
      </div>

      {message && (
        <div className={`settings-message ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      {/* Display Settings */}
      <section className="settings-section">
        <h2>Display</h2>
        <p className="section-description">Customize the look of your picture frame.</p>

        <div className="setting-group">
          <label className="setting-group-label">Frame Style</label>
          <div className="frame-picker">
            {FRAME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`frame-option ${currentFrame === opt.value ? 'active' : ''}`}
                onClick={() => handleSlideshowChange('frame', opt.value)}
              >
                <div className={`frame-preview ${opt.value === 'none' ? 'preview-none' : `preview-${opt.value}`}`}>
                  <div className="preview-image" />
                </div>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {currentFrame !== 'none' && (
          <div className="setting-group">
            <label className="setting-group-label">Mat Border</label>
            <p className="setting-hint">The border between frame and photo, like a real framed picture.</p>
            <div className="setting-row">
              <label>Show Mat</label>
              <button
                className={`toggle-btn ${currentMat ? 'active' : ''}`}
                onClick={() => handleSlideshowChange('mat', !currentMat)}
              >
                {currentMat ? 'ON' : 'OFF'}
              </button>
            </div>
            {currentMat && (
              <div className="mat-color-picker">
                {MAT_COLORS.map(opt => (
                  <button
                    key={opt.value}
                    className={`mat-color-option ${currentMatColor === opt.value ? 'active' : ''}`}
                    onClick={() => handleSlideshowChange('matColor', opt.value)}
                    title={opt.label}
                  >
                    <span className="mat-swatch" style={{ backgroundColor: opt.value }} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="setting-group">
          <label className="setting-group-label">Background</label>
          <div className="bg-picker">
            {BACKGROUND_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`bg-option ${currentBg === opt.value ? 'active' : ''}`}
                onClick={() => handleBackgroundChange(opt.value)}
              >
                <div className={`bg-preview bg-preview-${opt.value}`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {currentBg === 'color' && (
            <div className="setting-row" style={{ marginTop: 12 }}>
              <label>Color</label>
              <input
                type="color"
                value={config?.slideshow?.backgroundColor || '#000000'}
                onChange={(e) => handleSlideshowChange('backgroundColor', e.target.value)}
                className="color-input"
              />
              <span className="setting-value">{config?.slideshow?.backgroundColor || '#000000'}</span>
            </div>
          )}
        </div>
      </section>

      {/* Slideshow Settings */}
      <section className="settings-section">
        <h2>Slideshow</h2>

        <div className="setting-row">
          <label>Interval (seconds)</label>
          <input
            type="range"
            min="3"
            max="60"
            value={config?.slideshow?.interval || 10}
            onChange={(e) => handleSlideshowChange('interval', parseInt(e.target.value))}
          />
          <span className="setting-value">{config?.slideshow?.interval || 10}s</span>
        </div>

        <div className="setting-row">
          <label>Transition</label>
          <select
            value={config?.slideshow?.transition || 'fade'}
            onChange={(e) => handleSlideshowChange('transition', e.target.value)}
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>

        <div className="setting-row">
          <label>Shuffle</label>
          <button
            className={`toggle-btn ${config?.slideshow?.shuffle ? 'active' : ''}`}
            onClick={() => handleSlideshowChange('shuffle', !config?.slideshow?.shuffle)}
          >
            {config?.slideshow?.shuffle ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="setting-row">
          <label>Show Calendar</label>
          <button
            className={`toggle-btn ${config?.slideshow?.showCalendar !== false ? 'active' : ''}`}
            onClick={() => handleSlideshowChange('showCalendar', config?.slideshow?.showCalendar === false)}
          >
            {config?.slideshow?.showCalendar !== false ? 'ON' : 'OFF'}
          </button>
        </div>
      </section>

      {/* Active Album */}
      <section className="settings-section">
        <h2>Active Album</h2>
        <p className="section-description">Choose which album to display in the slideshow.</p>

        <div className="album-list">
          <button
            className={`album-option ${config?.activeAlbum === 'all' ? 'active' : ''}`}
            onClick={() => handleActiveAlbumChange('all')}
          >
            All Photos
          </button>
          {albums.map(album => (
            <button
              key={album.id}
              className={`album-option ${config?.activeAlbum === album.id ? 'active' : ''}`}
              onClick={() => handleActiveAlbumChange(album.id)}
            >
              {album.name} ({album.imageCount})
            </button>
          ))}
        </div>
      </section>

      {/* Album Management */}
      <section className="settings-section">
        <h2>Albums</h2>

        <div className="album-manage-list">
          {albums.map(album => (
            <div key={album.id} className="album-manage-row">
              {editingAlbum === album.id ? (
                <div className="album-edit-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameAlbum(album.id)}
                    autoFocus
                  />
                  <button className="btn-small btn-primary" onClick={() => handleRenameAlbum(album.id)}>Save</button>
                  <button className="btn-small btn-secondary" onClick={() => setEditingAlbum(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <span className="album-name">{album.name}</span>
                  <span className="album-count">{album.imageCount} images</span>
                  <div className="album-actions">
                    <button
                      className="btn-small btn-secondary"
                      onClick={() => { setEditingAlbum(album.id); setEditName(album.name); }}
                    >
                      Rename
                    </button>
                    {album.id !== 'default' && (
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteAlbum(album.id, album.name)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PIN Settings */}
      <section className="settings-section">
        <h2>PIN Protection</h2>
        <p className="section-description">
          {config?.hasPin
            ? 'A PIN is set. Enter a new PIN to change it, or leave blank and save to remove it.'
            : 'No PIN is set. Anyone on your network can manage images. Set a PIN to restrict access.'}
        </p>

        <div className="pin-form">
          <div className="setting-row">
            <label>New PIN</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter PIN (or leave blank to remove)"
              maxLength={8}
            />
          </div>
          <div className="setting-row">
            <label>Confirm PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN"
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && handlePinChange()}
            />
          </div>
          <button className="btn-primary" onClick={handlePinChange}>
            {config?.hasPin ? 'Update PIN' : 'Set PIN'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
