"use client";

import { useState } from "react";
import { JOB_CATEGORIES } from "../../../lib/constants/jobCategories";

export default function JobPositionForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    category: initialData.category || "",
    yearsRequired: initialData.yearsRequired || "",
    salaryMin: initialData.salaryMin || "",
    salaryMax: initialData.salaryMax || "",
    jobDescription: initialData.jobDescription || "",
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
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
            errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-700"
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
          style={{ fontFamily: "Open Sans, sans-serif" }}
          placeholder="e.g., Senior Software Engineer"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
            errors.category ? "border-red-500" : "border-gray-300 dark:border-gray-700"
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
          style={{ fontFamily: "Open Sans, sans-serif" }}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Years of Experience Required <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="yearsRequired"
          value={formData.yearsRequired}
          onChange={handleChange}
          step="0.5"
          min="0"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
            errors.yearsRequired ? "border-red-500" : "border-gray-300 dark:border-gray-700"
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
          style={{ fontFamily: "Open Sans, sans-serif" }}
          placeholder="e.g., 2.5"
        />
        {errors.yearsRequired && <p className="mt-1 text-sm text-red-500">{errors.yearsRequired}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Salary (INR)
          </label>
          <input
            type="number"
            name="salaryMin"
            value={formData.salaryMin}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
              errors.salaryMin ? "border-red-500" : "border-gray-300 dark:border-gray-700"
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
            placeholder="e.g., 500000"
          />
          {errors.salaryMin && <p className="mt-1 text-sm text-red-500">{errors.salaryMin}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Salary (INR)
          </label>
          <input
            type="number"
            name="salaryMax"
            value={formData.salaryMax}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
              errors.salaryMax ? "border-red-500" : "border-gray-300 dark:border-gray-700"
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
            placeholder="e.g., 1000000"
          />
          {errors.salaryMax && <p className="mt-1 text-sm text-red-500">{errors.salaryMax}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="jobDescription"
          value={formData.jobDescription}
          onChange={handleChange}
          rows={8}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F84416] ${
            errors.jobDescription ? "border-red-500" : "border-gray-300 dark:border-gray-700"
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none`}
          style={{ fontFamily: "Open Sans, sans-serif" }}
          placeholder="Describe the role, responsibilities, requirements, etc."
        />
        {errors.jobDescription && <p className="mt-1 text-sm text-red-500">{errors.jobDescription}</p>}
      </div>

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
