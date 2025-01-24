import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MapView from './components/MapView';
import ImmersiveView from './components/ImmersiveView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Map Page */}
        <Route path="/" element={<MapView />} />

        {/* Immersive 3D Page (NeRF Viewer) */}
        {/* :siteId is a URL parameter for loading specific site data */}
        <Route path="/immersive/:siteId" element={<ImmersiveView />} />
      </Routes>
    </Router>
  );
}

export default App;
