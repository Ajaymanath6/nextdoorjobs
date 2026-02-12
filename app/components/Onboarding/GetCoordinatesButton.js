"use client";

import { useState } from "react";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

/**
 * Extracts lat, lon from common Google Maps URL patterns.
 * Returns { lat, lon } or null if not found or invalid.
 */
function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") return null;
  const s = url.trim();
  if (!s) return null;

  // @lat,lon or @lat,lon,zoom
  const atMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,\d+z?)?/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      return { lat, lon };
    }
  }

  // ?q=lat,lon or &q=lat,lon
  const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lon = parseFloat(qMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      return { lat, lon };
    }
  }

  // !3dLAT!4dLON (embed style)
  const embedMatch = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (embedMatch) {
    const lat = parseFloat(embedMatch[1]);
    const lon = parseFloat(embedMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      return { lat, lon };
    }
  }

  return null;
}

function parseCoordinatesInput(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(/[,\s]+/).map((v) => v.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return null;
  return { lat, lon };
}

export default function GetCoordinatesButton({ onCoordinatesReceived, onSkip, isMobile = false }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsError, setCoordsError] = useState(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsError, setMapsError] = useState(null);

  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setError(isMobile ? "Geolocation is not supported by your browser" : "Geolocation is not supported. Use manual entry below or skip.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Location only works on HTTPS. Open this page via https:// (or use a secure tunnel) and try again.");
      return;
    }

    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);
        onCoordinatesReceived(latitude.toString(), longitude.toString());
      },
      (err) => {
        setIsGettingLocation(false);
        let errorMessage;
        if (isMobile) {
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
        } else {
          errorMessage = "Location unavailable. Use manual entry below or skip.";
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
  };

  const handleUseCoordinates = () => {
    setCoordsError(null);
    const result = parseCoordinatesInput(coordsInput);
    if (result) {
      onCoordinatesReceived(String(result.lat), String(result.lon));
    } else {
      setCoordsError("Enter valid latitude and longitude (e.g. 10.5276, 76.2144)");
    }
  };

  const handleUseMapsLink = () => {
    setMapsError(null);
    const result = parseGoogleMapsUrl(mapsUrl);
    if (result) {
      onCoordinatesReceived(String(result.lat), String(result.lon));
    } else {
      setMapsError("Could not find coordinates in this link. Try a direct link to a place on Google Maps.");
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-brand-stroke-weak rounded-lg focus:outline-none focus:border-brand-text-strong text-brand-text-strong placeholder:text-brand-text-placeholder";
  const buttonClass =
    "w-full px-4 py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const fontStyle = { fontFamily: "Open Sans, sans-serif", fontSize: "14px" };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={isGettingLocation}
            className={buttonClass}
            style={fontStyle}
          >
            {isGettingLocation ? "Getting your location…" : "Use your current location"}
          </button>
          <p className="text-xs text-brand-text-weak" style={fontStyle}>
            Your phone will ask to allow location. Tap Allow to use your device&apos;s GPS.
          </p>
          {error && (
            <p className="text-sm text-red-500" style={fontStyle}>
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={isGettingLocation}
            className={buttonClass}
            style={fontStyle}
          >
            {isGettingLocation ? "Getting your location…" : "Get my location"}
          </button>
          {error && (
            <p className="text-sm text-red-500" style={fontStyle}>
              {error}
            </p>
          )}
          <div className="space-y-3 pt-2 border-t border-brand-stroke-weak">
            <p className="text-sm font-medium text-brand-text-strong" style={fontStyle}>
              Or add location manually
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={coordsInput}
                onChange={(e) => setCoordsInput(e.target.value)}
                placeholder="e.g. 10.5276, 76.2144"
                className={inputClass}
                style={fontStyle}
              />
              <button
                type="button"
                onClick={handleUseCoordinates}
                className={buttonClass}
                style={fontStyle}
              >
                Use coordinates
              </button>
              {coordsError && (
                <p className="text-sm text-red-500" style={fontStyle}>
                  {coordsError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="Paste Google Maps link"
                className={inputClass}
                style={fontStyle}
              />
              <button
                type="button"
                onClick={handleUseMapsLink}
                className={buttonClass}
                style={fontStyle}
              >
                Use from link
              </button>
              {mapsError && (
                <p className="text-sm text-red-500" style={fontStyle}>
                  {mapsError}
                </p>
              )}
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-brand-text-weak hover:text-brand-text-strong underline w-full text-center"
        style={fontStyle}
      >
        Skip
      </button>
    </div>
  );
}
