"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Import CSS files (Next.js handles these)
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Dynamic import of Leaflet to avoid SSR issues
const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    // Import Leaflet first, then markercluster
    import("leaflet").then((LModule) => {
      const L = LModule.default;
      
      // Make L available globally for markercluster
      window.L = L;

      // Import markercluster after L is available
      return import("leaflet.markercluster").then(() => {
        // Fix for default marker icon issue in React
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const zoom = 2;

        // Map initialization with exact configuration
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          zoomAnimation: true,
          zoomAnimationThreshold: 4,
        }).setView([0, 0], zoom);

        // Tile layer with OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      });
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clean up global L
      if (typeof window !== "undefined") {
        delete window.L;
      }
    };
  }, []);

  return (
    <div className="flex-1 h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
});
