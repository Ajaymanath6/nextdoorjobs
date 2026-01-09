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
      try {
        const L = LModule.default;
        
        // Polyfill Image constructor for Leaflet if needed (only in Leaflet's context)
        if (typeof window !== 'undefined' && L && L.Browser) {
          // Store original Image if not already stored
          if (!window._originalImage) {
            window._originalImage = window.Image;
          }
          
          // Override Image constructor only if called without 'new'
          const OriginalImage = window._originalImage;
          const ImagePolyfill = function(...args) {
            // Always use 'new' operator
            return new OriginalImage(...args);
          };
          
          // Copy prototype
          ImagePolyfill.prototype = OriginalImage.prototype;
          Object.setPrototypeOf(ImagePolyfill, OriginalImage);
          
          // Temporarily override for Leaflet initialization
          const originalImage = window.Image;
          window.Image = ImagePolyfill;
          
          // Restore after a short delay to avoid breaking other code
          setTimeout(() => {
            if (window._originalImage) {
              window.Image = window._originalImage;
            }
          }, 100);
        }

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
      } catch (error) {
        console.error("Error initializing background map:", error);
      }
    }).catch((error) => {
      console.error("Error loading Leaflet:", error);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  return <div ref={mapRef} className="w-full h-full absolute inset-0" style={{ minHeight: "100vh" }} />;
};

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(BackgroundMapComponent), {
  ssr: false,
});
