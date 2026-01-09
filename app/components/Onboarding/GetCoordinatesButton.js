"use client";

import { useState } from "react";

export default function GetCoordinatesButton({ onCoordinatesReceived, onSkip }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  const handleGetCoordinates = () => {
    setIsGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);
        onCoordinatesReceived(latitude.toString(), longitude.toString());
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Failed to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak">
      <button
        type="button"
        onClick={handleGetCoordinates}
        disabled={isGettingLocation}
        className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
      >
        {isGettingLocation ? "Getting your location..." : "Get your coordinates"}
      </button>
      {error && (
        <p className="text-sm text-red-500" style={{ fontFamily: "Open Sans, sans-serif" }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-brand-text-weak hover:text-brand-text-strong underline w-full text-center"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        Skip
      </button>
    </div>
  );
}
