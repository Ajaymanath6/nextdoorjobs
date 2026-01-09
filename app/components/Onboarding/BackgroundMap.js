"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Import CSS files
import "leaflet/dist/leaflet.css";

const BackgroundMapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet to avoid SSR issues
    import("leaflet").then((LModule) => {
      const L = LModule.default;

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

      // Set initial view to Kerala, India
      const initialLat = 10.5276;
      const initialLon = 76.2144;
      const zoom = 7; // Wider view for background

      // Map initialization - no controls for background
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([initialLat, initialLon], zoom);

      // Tile layer with OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  return <div ref={mapRef} className="w-full h-full" />;
};

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(BackgroundMapComponent), {
  ssr: false,
});
