"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Close } from "@carbon/icons-react";
import StateDistrictSelector from "./Onboarding/StateDistrictSelector";
import GetCoordinatesButton from "./Onboarding/GetCoordinatesButton";

export default function EditCompanyLocationModal({
  isOpen,
  onClose,
  company,
  onLocationUpdated,
}) {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);
  const [showCoordinatesInput, setShowCoordinatesInput] = useState(false);

  // Initialize form with company data
  useEffect(() => {
    if (company) {
      setState(company.state || "");
      setDistrict(company.district || "");
      setLatitude(company.latitude?.toString() || "");
      setLongitude(company.longitude?.toString() || "");
      setPincode(company.pincode || "");
    }
  }, [company]);

  const handleSave = async () => {
    if (!state || !district) {
      setError("State and district are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/onboarding/company/${company.id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          district,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          pincode: pincode || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLocationUpdated?.(data.company);
        onClose();
      } else {
        setError(data.error || "Failed to update location");
      }
    } catch (err) {
      console.error("Error updating location:", err);
      setError("Failed to update location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
        style={{ zIndex: 1003 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-text-strong">
            Edit Company Location
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-brand-text-weak hover:bg-brand-bg-fill"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* State Field */}
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text-strong">
              State *
            </label>
            {showStateSelector ? (
              <StateDistrictSelector
                onStateSelect={(selectedState) => {
                  setState(selectedState);
                  setShowStateSelector(false);
                  setDistrict("");
                }}
                selectedState={state}
                showDistrict={false}
              />
            ) : (
              <button
                onClick={() => setShowStateSelector(true)}
                className="w-full rounded-lg border border-brand-stroke-border bg-brand-bg-white px-3 py-2 text-left text-brand-text-strong hover:border-brand-stroke-weak"
              >
                {state || "Select state"}
              </button>
            )}
          </div>

          {/* District Field */}
          {state && (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-text-strong">
                District *
              </label>
              {showDistrictSelector ? (
                <StateDistrictSelector
                  onDistrictSelect={(selectedDistrict) => {
                    setDistrict(selectedDistrict);
                    setShowDistrictSelector(false);
                  }}
                  selectedState={state}
                  selectedDistrict={district}
                  showDistrict={true}
                />
              ) : (
                <button
                  onClick={() => setShowDistrictSelector(true)}
                  className="w-full rounded-lg border border-brand-stroke-border bg-brand-bg-white px-3 py-2 text-left text-brand-text-strong hover:border-brand-stroke-weak"
                >
                  {district || "Select district"}
                </button>
              )}
            </div>
          )}

          {/* Pincode Field */}
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text-strong">
              Pincode
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter pincode"
              className="w-full rounded-lg border border-brand-stroke-border bg-brand-bg-white px-3 py-2 text-brand-text-strong placeholder-brand-text-weak focus:border-brand focus:outline-none"
            />
          </div>

          {/* Coordinates Section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-brand-text-strong">
                Coordinates
              </label>
              <button
                onClick={() => setShowCoordinatesInput(!showCoordinatesInput)}
                className="text-xs text-brand hover:underline"
              >
                {showCoordinatesInput ? "Hide" : "Update coordinates"}
              </button>
            </div>
            
            {showCoordinatesInput && (
              <div className="space-y-3">
                <GetCoordinatesButton
                  onCoordinatesReceived={(lat, lon) => {
                    setLatitude(lat.toString());
                    setLongitude(lon.toString());
                  }}
                  onSkip={() => setShowCoordinatesInput(false)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-brand-text-weak">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Latitude"
                      className="w-full rounded-lg border border-brand-stroke-border bg-brand-bg-white px-2 py-1.5 text-sm text-brand-text-strong placeholder-brand-text-weak focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-brand-text-weak">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Longitude"
                      className="w-full rounded-lg border border-brand-stroke-border bg-brand-bg-white px-2 py-1.5 text-sm text-brand-text-strong placeholder-brand-text-weak focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!showCoordinatesInput && (latitude || longitude) && (
              <div className="text-xs text-brand-text-weak">
                Current: {latitude && longitude ? `${latitude}, ${longitude}` : "Not set"}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-brand-stroke-border px-4 py-2 text-brand-text-strong hover:bg-brand-bg-fill"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-brand px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
              disabled={saving || !state || !district}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
