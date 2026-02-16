"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Close } from "@carbon/icons-react";
import themeClasses from "../../theme-utility-classes.json";
import { SERVICE_TYPES } from "../../../lib/constants/serviceTypes";
import StateDistrictSelector from "./StateDistrictSelector";
import GetCoordinatesButton from "./GetCoordinatesButton";

export default function EditGigModal({ isOpen, onClose, gig, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [customServiceType, setCustomServiceType] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [experienceWithGig, setExperienceWithGig] = useState("");
  const [customersTillDate, setCustomersTillDate] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [locality, setLocality] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const brand = themeClasses.brand;
  const inputClasses = "w-full px-3 py-2 rounded-lg border border-brand-stroke-weak text-sm text-brand-text-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

  useEffect(() => {
    if (gig && isOpen) {
      setTitle(gig.title || "");
      setDescription(gig.description || "");
      const st = gig.serviceType || "";
      setServiceType(SERVICE_TYPES.includes(st) ? st : (st ? "Other" : ""));
      setCustomServiceType(SERVICE_TYPES.includes(st) ? "" : st);
      setExpectedSalary(gig.expectedSalary || "");
      setExperienceWithGig(gig.experienceWithGig || "");
      setCustomersTillDate(gig.customersTillDate != null ? String(gig.customersTillDate) : "");
      setSelectedState(gig.state || "");
      setSelectedDistrict(gig.district || "");
      setPincode(gig.pincode || "");
      setLocality(gig.locality || "");
      setLatitude(gig.latitude != null ? String(gig.latitude) : "");
      setLongitude(gig.longitude != null ? String(gig.longitude) : "");
      setError(null);
    }
  }, [gig, isOpen]);

  const getEffectiveServiceType = () => {
    if (serviceType === "Other" && customServiceType.trim()) return customServiceType.trim();
    return serviceType || customServiceType.trim() || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gig?.id) return;
    setError(null);
    setSaving(true);

    const titleTrim = title.trim();
    if (!titleTrim) {
      setError("Title is required");
      setSaving(false);
      return;
    }
    const effectiveServiceType = getEffectiveServiceType();
    if (!effectiveServiceType) {
      setError("Service type is required");
      setSaving(false);
      return;
    }

    const data = {
      title: titleTrim,
      description: description.trim() || null,
      serviceType: effectiveServiceType,
      expectedSalary: expectedSalary.trim() || null,
      experienceWithGig: experienceWithGig.trim() || null,
      customersTillDate: customersTillDate.trim() ? parseInt(customersTillDate, 10) : null,
      state: selectedState.trim() || null,
      district: selectedDistrict.trim() || null,
      pincode: pincode.trim() || null,
      locality: locality.trim() || null,
      latitude: latitude && longitude ? parseFloat(latitude) : null,
      longitude: latitude && longitude ? parseFloat(longitude) : null,
    };

    if (Number.isNaN(data.customersTillDate)) data.customersTillDate = null;

    try {
      const res = await fetch(`/api/gigs/${gig.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        onSaved?.(json.gig);
        onClose();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gigDeleted", { detail: { gigId: gig.id } }));
        }
      } else {
        setError(json.error || "Failed to update gig");
      }
    } catch (err) {
      setError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!gig) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed left-1/2 top-1/2 z-[1002] flex max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-weak bg-brand-bg-white shadow-lg"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-stroke-weak px-6 py-4">
          <h1 className={`text-xl font-semibold ${brand.text.strong}`}>Edit Gig</h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
            aria-label="Close"
          >
            <Close size={24} className="text-brand-stroke-strong" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClasses}
                placeholder="Gig title"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClasses} min-h-[80px]`}
                placeholder="Short description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className={inputClasses}
              >
                <option value="">Select...</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {serviceType === "Other" && (
                <input
                  type="text"
                  value={customServiceType}
                  onChange={(e) => setCustomServiceType(e.target.value)}
                  className={`${inputClasses} mt-2`}
                  placeholder="Enter custom service type"
                />
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Expected Salary</label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                className={inputClasses}
                placeholder="e.g. 500/day, 15000/month"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Experience</label>
              <input
                type="text"
                value={experienceWithGig}
                onChange={(e) => setExperienceWithGig(e.target.value)}
                className={inputClasses}
                placeholder="e.g. 2 years"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Customers Served</label>
              <input
                type="number"
                min="0"
                value={customersTillDate}
                onChange={(e) => setCustomersTillDate(e.target.value)}
                className={inputClasses}
                placeholder="Number of customers"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Location</label>
              <div className="space-y-2">
                <StateDistrictSelector
                  selectedState={selectedState}
                  selectedDistrict={null}
                  showDistrict={false}
                  onStateSelect={(s) => {
                    setSelectedState(s);
                    setSelectedDistrict("");
                  }}
                  onDistrictSelect={() => {}}
                />
                {selectedState && (
                  <StateDistrictSelector
                    selectedState={selectedState}
                    selectedDistrict={selectedDistrict}
                    showDistrict={true}
                    onStateSelect={() => {}}
                    onDistrictSelect={setSelectedDistrict}
                  />
                )}
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className={inputClasses}
                  placeholder="Pincode (optional)"
                />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className={inputClasses}
                  placeholder="Locality / area (optional)"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-1`}>Coordinates (optional)</label>
              <GetCoordinatesButton
                onCoordinatesReceived={(lat, lon) => {
                  setLatitude(lat);
                  setLongitude(lon);
                }}
                onSkip={() => {}}
                isMobile={false}
              />
              {(latitude || longitude) && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className={inputClasses}
                    placeholder="Latitude"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className={inputClasses}
                    placeholder="Longitude"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-2 border-t border-brand-stroke-weak px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-brand text-brand-bg-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
