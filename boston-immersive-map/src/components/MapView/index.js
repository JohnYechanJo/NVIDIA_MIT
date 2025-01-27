import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine"; // Must be imported once somewhere in your project

import "./index.css"; // Your custom styles
import sitesData from "../../data/sites.json";
import RoutingMachine from "./RoutingMachine";

function MapView() {
  const [sites, setSites] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null); // Store the coordinates for the active route
  const navigate = useNavigate();

  // Load site data & attempt to get user location
  useEffect(() => {
    setSites(sitesData);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fix Leaflet icon paths (Leaflet quirk in React)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  // Fallback map center
  const bostonCoordinates = [42.3601, -71.0589];

  return (
    <MapContainer
      center={bostonCoordinates}
      zoom={13}
      className="map-container"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sites.map((site) => (
        <Marker key={site.id} position={site.coordinates}>
          <Popup>
            <h3>{site.name}</h3>
            <p>{site.description}</p>

            {site.items.map((item) => (
              <div className="item" key={item.id}>
                <button
                  onClick={() => navigate(`/immersive/${site.id}/${item.id}`)}
                >
                  {item.name}
                </button>
                <p>{item.description}</p>
              </div>
            ))}

            {/* Button to display a route on the map using Leaflet Routing Machine */}
            <button onClick={() => setActiveRoute(site.coordinates)} className="show-route-button">
              Show Route
            </button>
          </Popup>
        </Marker>
      ))}

        <RoutingMachine
          userLocation={userLocation}
          siteCoordinates={activeRoute}
        />
    </MapContainer>
  );
}

export default MapView;
