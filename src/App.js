import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Slideshow from './components/Slideshow';
import ManageImages from './components/ManageImages';
import Settings from './components/Settings';
import PinGate from './components/PinGate';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Slideshow />} />
          <Route path="/manage" element={<PinGate><ManageImages /></PinGate>} />
          <Route path="/settings" element={<PinGate><Settings /></PinGate>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
