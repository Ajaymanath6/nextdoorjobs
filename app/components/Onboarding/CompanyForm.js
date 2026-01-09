"use client";

import { useState } from "react";
import { FUNDING_SERIES } from "../../../lib/constants/jobCategories";
import InputField from "../InputField";

export default function CompanyForm({ onSubmit, initialData = {} }) {
  // Ensure initialData is always an object, never null
  const safeInitialData = initialData || {};
  
  const [formData, setFormData] = useState({
    name: safeInitialData.name || "",
    logo: null,
    logoPreview: safeInitialData.logoPath || null,
    websiteUrl: safeInitialData.websiteUrl || "",
    fundingSeries: safeInitialData.fundingSeries || "",
    latitude: safeInitialData.latitude || "",
    longitude: safeInitialData.longitude || "",
    state: safeInitialData.state || "",
    district: safeInitialData.district || "",
    pincode: safeInitialData.pincode || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          logo: "File size must be less than 5MB",
        }));
        return;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          logo: "Only JPEG, PNG, WebP, and GIF images are allowed",
        }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo: file,
          logoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.district.trim()) {
      newErrors.district = "District is required";
    }
    if (formData.latitude && (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = "Invalid latitude";
    }
    if (formData.longitude && (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = "Invalid longitude";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputField
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        label="Company Name"
        placeholder="Enter company name"
        error={errors.name}
        required
      />

      <div>
        <label className="block text-sm font-medium text-brand-text-strong mb-2">
          Company Logo
        </label>
        <div className="flex items-center gap-4">
          {formData.logoPreview && (
            <img
              src={formData.logoPreview}
              alt="Logo preview"
              className="w-20 h-20 object-cover rounded-lg border border-brand-stroke-weak"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="text-sm text-brand-text-strong"
          />
        </div>
        {errors.logo && <p className="mt-1 text-sm text-red-500">{errors.logo}</p>}
        <p className="mt-1 text-xs text-brand-text-weak">Max size: 5MB. Formats: JPEG, PNG, WebP, GIF</p>
      </div>

      <div>
        <InputField
          type="url"
          name="websiteUrl"
          value={formData.websiteUrl}
          onChange={handleChange}
          label="Company Website URL"
          placeholder="https://example.com or example.com"
          error={errors.websiteUrl}
        />
        <p className="mt-1 text-xs text-brand-text-weak">Enter your company website URL (optional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text-strong mb-2">
          Funding Series
        </label>
        <select
          name="fundingSeries"
          value={formData.fundingSeries}
          onChange={handleChange}
          className="w-full px-4 py-2 border-brand-stroke-weak shadow-md rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder"
          style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
        >
          <option value="" className="text-brand-text-placeholder">Select funding series</option>
          {FUNDING_SERIES.map((series) => (
            <option key={series.value} value={series.value}>
              {series.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          type="number"
          name="latitude"
          value={formData.latitude}
          onChange={handleChange}
          step="any"
          label="Latitude"
          placeholder="e.g., 10.5276"
          error={errors.latitude}
        />
        <InputField
          type="number"
          name="longitude"
          value={formData.longitude}
          onChange={handleChange}
          step="any"
          label="Longitude"
          placeholder="e.g., 76.2144"
          error={errors.longitude}
        />
      </div>

      <InputField
        type="text"
        name="state"
        value={formData.state}
        onChange={handleChange}
        label="State"
        placeholder="e.g., Kerala"
        error={errors.state}
        required
      />

      <InputField
        type="text"
        name="district"
        value={formData.district}
        onChange={handleChange}
        label="District"
        placeholder="e.g., Thrissur"
        error={errors.district}
        required
      />

      <InputField
        type="text"
        name="pincode"
        value={formData.pincode}
        onChange={handleChange}
        label="Pincode"
        placeholder="e.g., 680001"
      />

      <button
        type="submit"
        className="w-full px-6 py-3 bg-[#F84416] text-white rounded-lg hover:bg-[#EA4C00] transition-colors"
        style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
      >
        Continue
      </button>
    </form>
  );
}
