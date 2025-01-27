import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

function RoutingMachine({ userLocation, siteCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !userLocation || !siteCoordinates) return;

    let routingControl;

    try {
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation[0], userLocation[1]),
          L.latLng(siteCoordinates[0], siteCoordinates[1]),
        ],
        lineOptions: {
          styles: [{ color: "#6FA1EC", weight: 4 }],
          interactive: false
        },
        showAlternatives: false,
        addWaypoints: false,
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1", 
          // or your own service URL
        }),
      }).addTo(map);
    } catch (err) {
      console.error("Routing control error:", err);
    }

    // Cleanup on unmount
    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, userLocation, siteCoordinates]);

  return null; // No visible React component
}

export default RoutingMachine;
