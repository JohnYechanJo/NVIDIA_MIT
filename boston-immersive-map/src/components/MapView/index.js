import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

import 'leaflet/dist/leaflet.css';
import sitesData from '../../data/sites.json'; // If using a local JSON

function MapView() {
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();

  // Load site data on mount
  useEffect(() => {
    // If you have an API, fetch it here.
    // For a local JSON file, just set the imported data:
    setSites(sitesData);
  }, []);

  // Ensure the default icon is properly set up (Leaflet quirk in React)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  // Center on Boston
  const bostonCoordinates = [42.3601, -71.0589];

  return (
    <MapContainer center={bostonCoordinates} zoom={13} style={{ height: '100vh' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {sites.map(site => (
        <Marker key={site.id} position={site.coordinates}>
          <Popup>
            <h3>{site.name}</h3>
            <p>{site.description}</p>
            {site.items.map(item => (
              <button key={item.id} onClick={() => navigate(`/immersive/${site.id}/${item.id}`)}>
                View Immersive: {item.name}
              </button>
            ))}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapView;
