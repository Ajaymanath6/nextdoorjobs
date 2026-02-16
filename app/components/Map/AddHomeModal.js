"use client";

import { useState } from "react";
import Modal from "../Modal";
import { Close } from "@carbon/icons-react";
import themeClasses from "../../theme-utility-classes.json";

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
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      return { lat, lon };
    }
  }

  const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lon = parseFloat(qMatch[2]);
    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      return { lat, lon };
    }
  }

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

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`, { credentials: "same-origin" });
    const data = await res.json();
    return {
      locality: data.locality || data.village || data.city || data.town || null,
      district: data.district || data.county || null,
      state: data.state || null,
    };
  } catch {
    return { locality: null, district: null, state: null };
  }
}

export default function AddHomeModal({ isOpen, onClose, onSaved, initialHome }) {
  const brand = themeClasses.brand;
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsError, setCoordsError] = useState(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsError, setMapsError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const inputClass = "w-full px-4 py-2 border border-brand-stroke-strong rounded-lg focus:outline-none focus:border-brand focus:ring-1 text-sm text-brand-text-strong placeholder:text-brand-text-placeholder";
  const buttonClass = "w-full px-4 py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const fontStyle = { fontFamily: "Open Sans, sans-serif", fontSize: "14px" };

  const handleSave = async (lat, lon) => {
    setSaveError(null);
    setSaving(true);

    try {
      const { locality, district, state } = await reverseGeocode(lat, lon);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          homeLatitude: lat,
          homeLongitude: lon,
          homeLocality: locality,
          homeDistrict: district,
          homeState: state,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        onSaved?.(data.user);
        onClose();
      } else {
        setSaveError(data.error || "Failed to save home location");
      }
    } catch (err) {
      setSaveError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Use manual entry below.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Location only works on HTTPS.");
      return;
    }

    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);
        handleSave(latitude, longitude);
      },
      (err) => {
        setIsGettingLocation(false);
        setError(err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Location unavailable. Use manual entry below.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    requestAnimationFrame(() => setIsGettingLocation(true));
  };

  const handleUseCoordinates = () => {
    setCoordsError(null);
    const result = parseCoordinatesInput(coordsInput);
    if (result) {
      handleSave(result.lat, result.lon);
    } else {
      setCoordsError("Enter valid latitude and longitude (e.g. 10.5276, 76.2144)");
    }
  };

  const handleUseMapsLink = () => {
    setMapsError(null);
    const result = parseGoogleMapsUrl(mapsUrl);
    if (result) {
      handleSave(result.lat, result.lon);
    } else {
      setMapsError("Could not find coordinates in this link. Try a direct link to a place on Google Maps.");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed left-1/2 top-1/2 z-[1002] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-weak bg-brand-bg-white shadow-lg"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-stroke-weak px-6 py-4">
          <h2 className={`text-lg font-semibold ${brand.text.strong}`}>{initialHome ? "Edit home" : "Add home"}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors" aria-label="Close">
            <Close size={24} className="text-brand-stroke-strong" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {saveError && <p className="text-sm text-red-600" role="alert">{saveError}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={isGettingLocation || saving}
            className={buttonClass}
            style={fontStyle}
          >
            {isGettingLocation ? "Getting your location…" : "Use my current location"}
          </button>

          <div className="space-y-3 pt-2 border-t border-brand-stroke-weak">
            <p className={`text-sm font-medium ${brand.text.strong}`}>Or add location manually</p>
            <div className="space-y-2">
              <input
                type="text"
                value={coordsInput}
                onChange={(e) => setCoordsInput(e.target.value)}
                placeholder="e.g. 10.5276, 76.2144"
                className={inputClass}
                style={fontStyle}
                disabled={saving}
              />
              <button type="button" onClick={handleUseCoordinates} disabled={saving} className={buttonClass} style={fontStyle}>
                Use coordinates
              </button>
              {coordsError && <p className="text-sm text-red-600">{coordsError}</p>}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="Paste Google Maps link"
                className={inputClass}
                style={fontStyle}
                disabled={saving}
              />
              <button type="button" onClick={handleUseMapsLink} disabled={saving} className={buttonClass} style={fontStyle}>
                Use from link
              </button>
              {mapsError && <p className="text-sm text-red-600">{mapsError}</p>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
