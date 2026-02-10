"use client";

import { useState } from "react";

export default function GetCoordinatesButton({ onCoordinatesReceived, onSkip, isMobile = false }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  const handleGetCoordinates = () => {
    if (!isMobile) return;
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Location only works on HTTPS. Open this page via https:// (or use a secure tunnel) and try again.");
      return;
    }

    // Must call getCurrentPosition in the same synchronous click stack (before any setState).
    // Otherwise mobile browsers often skip the system "Allow location?" modal and return PERMISSION_DENIED.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);
        onCoordinatesReceived(latitude.toString(), longitude.toString());
      },
      (err) => {
        setIsGettingLocation(false);
        let errorMessage;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              "Location was denied. If you didn't see the phone's \"Allow\" prompt, open your browser or phone Settings → Site settings → Location and allow it for this site, then tap the button again.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. You can skip or enter coordinates manually in chat.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Try again or skip.";
            break;
          default:
            errorMessage = "Could not get your location. Try again or skip.";
            break;
        }
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
    requestAnimationFrame(() => setIsGettingLocation(true));
    setError(null);
  };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={isGettingLocation}
            className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
          >
            {isGettingLocation ? "Getting your location…" : "Use your current location"}
          </button>
          <p className="text-xs text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
            Your phone will ask to allow location. Tap Allow to use your device&apos;s GPS.
          </p>
          {error && (
            <p className="text-sm text-red-500" style={{ fontFamily: "Open Sans, sans-serif" }}>
              {error}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
          On desktop, skip and enter coordinates manually in chat if needed (e.g. 10.5276, 76.2144).
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
