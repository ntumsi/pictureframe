import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Slideshow from './components/Slideshow';
import ManageImages from './components/ManageImages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Slideshow />} />
          <Route path="/manage" element={<ManageImages />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
