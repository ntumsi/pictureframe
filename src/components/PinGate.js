import React, { useEffect, useState } from 'react';
import { verifyPin, getConfig } from '../api/imageService';
import '../styles/PinGate.css';

const PinGate = ({ children }) => {
  const [status, setStatus] = useState('loading'); // loading, open, locked, unlocked
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      const config = await getConfig();
      if (!config || !config.hasPin) {
        setStatus('open');
        return;
      }

      // Check if we already have a valid PIN in session
      const storedPin = sessionStorage.getItem('pictureframe-pin');
      if (storedPin) {
        const result = await verifyPin(storedPin);
        if (result.valid) {
          setStatus('unlocked');
          return;
        }
        // Stored PIN is no longer valid
        sessionStorage.removeItem('pictureframe-pin');
      }

      setStatus('locked');
    };

    checkAccess();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await verifyPin(pin);
    if (result.valid) {
      sessionStorage.setItem('pictureframe-pin', pin);
      setStatus('unlocked');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  if (status === 'loading') {
    return <div className="pin-gate-loading">Loading...</div>;
  }

  if (status === 'open' || status === 'unlocked') {
    return <>{children}</>;
  }

  return (
    <div className="pin-gate">
      <div className="pin-gate-box">
        <h2>Enter PIN</h2>
        <p>This area is protected. Enter your PIN to continue.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            maxLength={8}
            autoFocus
            className="pin-input"
          />
          {error && <p className="pin-error">{error}</p>}
          <button type="submit" className="pin-submit">Unlock</button>
        </form>
      </div>
    </div>
  );
};

export default PinGate;
