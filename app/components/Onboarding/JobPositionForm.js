"use client";

import { useState } from "react";
import { JOB_CATEGORIES } from "../../../lib/constants/jobCategories";
import InputField from "../InputField";

export default function JobPositionForm({ onSubmit, initialData = {} }) {
  // Ensure initialData is always an object, never null
  const safeInitialData = initialData || {};
  
  const [formData, setFormData] = useState({
    title: safeInitialData.title || "",
    category: safeInitialData.category || "",
    yearsRequired: safeInitialData.yearsRequired || "",
    salaryMin: safeInitialData.salaryMin || "",
    salaryMax: safeInitialData.salaryMax || "",
    jobDescription: safeInitialData.jobDescription || "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (formData.yearsRequired === "" || isNaN(parseFloat(formData.yearsRequired)) || parseFloat(formData.yearsRequired) < 0) {
      newErrors.yearsRequired = "Years required must be a non-negative number";
    }
    if (formData.salaryMin && (isNaN(parseInt(formData.salaryMin)) || parseInt(formData.salaryMin) < 0)) {
      newErrors.salaryMin = "Minimum salary must be a non-negative integer";
    }
    if (formData.salaryMax && (isNaN(parseInt(formData.salaryMax)) || parseInt(formData.salaryMax) < 0)) {
      newErrors.salaryMax = "Maximum salary must be a non-negative integer";
    }
    if (formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax)) {
      newErrors.salaryMax = "Maximum salary must be greater than minimum salary";
    }
    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = "Job description is required";
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
        name="title"
        value={formData.title}
        onChange={handleChange}
        label="Job Title"
        placeholder="e.g., Senior Software Engineer"
        error={errors.title}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2 border-brand-stroke-weak shadow-md rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill ${
            errors.category ? "border-red-500" : ""
          } bg-brand-bg-white text-gray-900 dark:text-gray-100`}
          style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
        >
          <option value="">Select category</option>
          {JOB_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>

      <InputField
        type="number"
        name="yearsRequired"
        value={formData.yearsRequired}
        onChange={handleChange}
        step="0.5"
        min="0"
        label="Years of Experience Required"
        placeholder="e.g., 2.5"
        error={errors.yearsRequired}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          type="number"
          name="salaryMin"
          value={formData.salaryMin}
          onChange={handleChange}
          min="0"
          label="Minimum Salary (INR)"
          placeholder="e.g., 500000"
          error={errors.salaryMin}
        />
        <InputField
          type="number"
          name="salaryMax"
          value={formData.salaryMax}
          onChange={handleChange}
          min="0"
          label="Maximum Salary (INR)"
          placeholder="e.g., 1000000"
          error={errors.salaryMax}
        />
      </div>

      <InputField
        type="textarea"
        name="jobDescription"
        value={formData.jobDescription}
        onChange={handleChange}
        rows={8}
        label="Job Description"
        placeholder="Describe the role, responsibilities, requirements, etc."
        error={errors.jobDescription}
        required
        className="resize-none"
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
