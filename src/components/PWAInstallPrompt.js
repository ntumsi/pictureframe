import React, { useState, useEffect } from 'react';

// Simple toast-style notification that shows when PWA can be installed
const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      window.deferredPrompt = e;
      // Show our custom install button
      setShowPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Hide the button once installed
      setShowPrompt(false);
      // Clear the deferredPrompt
      window.deferredPrompt = null;
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user is on Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // If not on Android, immediately hide the prompt
    if (!isAndroid) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!window.deferredPrompt) {
      console.log('No deferred prompt available');
      setShowPrompt(false);
      return;
    }

    // Show the install prompt
    window.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await window.deferredPrompt.userChoice;
    
    // Reset the deferred prompt variable
    window.deferredPrompt = null;
    
    // Hide our install button
    setShowPrompt(false);
    
    console.log('User response to the install prompt:', choiceResult.outcome);
  };

  if (!showPrompt) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '300px',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <p style={{ margin: '0 0 10px 0', textAlign: 'center' }}>
        Install PicFrame on your device for a better experience
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowPrompt(false)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid white',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Not now
        </button>
        <button
          onClick={handleInstallClick}
          style={{
            backgroundColor: '#4a90e2',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;