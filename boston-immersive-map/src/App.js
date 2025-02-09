import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MapView from './components/MapView';
import ImmersiveView from './components/ImmersiveView';
import './App.css'; // Import CSS for the entire app

function App() {
  return (
    <div className="app-container">
        {/* Project Info Box */}
        <div className="project-info-box">
        <h1 className="project-title">Immersive Boston</h1>
        <p className="project-subtitle">
          Explore Boston in 3D.
        </p>
        <a href="https://github.com/Charley-xiao/NVIDIA_MIT" className="project-link">
          View on GitHub
        </a>
      </div>


    {/*Router for other pages*/}
    <Router>
      <Routes>
        {/* Main Map Page */}
        <Route path="/" element={<MapView />} />

        {/* Immersive 3D Page (NeRF Viewer) */}
        {/* :siteId is a URL parameter for loading specific site data */}
        <Route path="/immersive/:siteId/:itemId" element={<ImmersiveView />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App;
