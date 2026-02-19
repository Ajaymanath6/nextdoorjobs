"use client";

import { useState } from "react";
import Modal from "../Modal";
import { Close } from "@carbon/icons-react";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") return null;
  const s = url.trim();
  if (!s) return null;
  const atMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,\d+z?)?/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) return { lat, lon };
  }
  const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lon = parseFloat(qMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) return { lat, lon };
  }
  const embedMatch = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (embedMatch) {
    const lat = parseFloat(embedMatch[1]);
    const lon = parseFloat(embedMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) return { lat, lon };
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

export default function GetCoordinatesModal({ isOpen, onClose, onLocation }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsError, setCoordsError] = useState(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsError, setMapsError] = useState(null);

  const inputClass =
    "w-full px-4 py-2 border border-brand-stroke-strong rounded-lg focus:outline-none focus:border-brand focus:ring-1 text-sm text-brand-text-strong placeholder:text-brand-text-placeholder";
  const buttonClass =
    "w-full px-4 py-3 bg-brand text-brand-bg-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm font-sans";

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Use manual entry below.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Location only works on HTTPS.");
      return;
    }
    setError(null);
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude } = position.coords;
        onLocation?.({ lat: latitude, lng: longitude });
        onClose?.();
      },
      (err) => {
        setIsGettingLocation(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Location unavailable. Use manual entry below."
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleUseCoordinates = () => {
    setCoordsError(null);
    const result = parseCoordinatesInput(coordsInput);
    if (result) {
      onLocation?.({ lat: result.lat, lng: result.lon });
      onClose?.();
    } else {
      setCoordsError("Enter valid latitude and longitude (e.g. 10.5276, 76.2144)");
    }
  };

  const handleUseMapsLink = () => {
    setMapsError(null);
    const result = parseGoogleMapsUrl(mapsUrl);
    if (result) {
      onLocation?.({ lat: result.lat, lng: result.lon });
      onClose?.();
    } else {
      setMapsError("Could not find coordinates in this link. Try a direct link to a place on Google Maps.");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed left-1/2 top-1/2 z-[1003] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-weak bg-brand-bg-white shadow-lg font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-stroke-weak px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-text-strong">Choose your location</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
            aria-label="Close"
          >
            <Close size={24} className="text-brand-stroke-strong" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className={buttonClass}
          >
            {isGettingLocation ? "Getting your location…" : "Use my current location"}
          </button>

          <div className="space-y-3 pt-2 border-t border-brand-stroke-weak">
            <p className="text-sm font-medium text-brand-text-strong">Or enter location manually</p>
            <div className="space-y-2">
              <input
                type="text"
                value={coordsInput}
                onChange={(e) => setCoordsInput(e.target.value)}
                placeholder="e.g. 10.5276, 76.2144"
                className={inputClass}
              />
              <button type="button" onClick={handleUseCoordinates} className={buttonClass}>
                Locate on map
              </button>
              {coordsError && (
                <p className="text-sm text-red-600">{coordsError}</p>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="Paste Google Maps link"
                className={inputClass}
              />
              <button type="button" onClick={handleUseMapsLink} className={buttonClass}>
                Use from link
              </button>
              {mapsError && (
                <p className="text-sm text-red-600">{mapsError}</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-brand-stroke-weak">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 border border-brand-stroke-weak text-brand-text-strong rounded-lg hover:bg-brand-bg-fill text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
