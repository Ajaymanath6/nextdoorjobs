"use client";

import { useState } from "react";

const SALARY_RANGES = [
  { min: 0, max: 50000, label: "Up to ₹50K" },
  { min: 50000, max: 100000, label: "₹50K - ₹1L" },
  { min: 100000, max: 200000, label: "₹1L - ₹2L" },
  { min: 200000, max: 500000, label: "₹2L - ₹5L" },
  { min: 500000, max: 1000000, label: "₹5L - ₹10L" },
  { min: 1000000, max: null, label: "₹10L+" },
];

export default function SalaryRangeBadges({ onSelect, onSkip, selectedMin = null, selectedMax = null }) {
  const [customSalary, setCustomSalary] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customSalary.trim()) {
      const salaryMatch = customSalary.match(/(\d+)\s*-\s*(\d+)/i) || customSalary.match(/(\d+)\s*to\s*(\d+)/i);
      if (salaryMatch) {
        onSelect(salaryMatch[1], salaryMatch[2]);
      } else {
        alert("Please provide salary range as 'min-max' (e.g., 50000-100000)");
      }
    }
  };

  const isRangeSelected = (min, max) => {
    return selectedMin == min && selectedMax == max;
  };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak">
      <div className="flex flex-wrap gap-2">
        {SALARY_RANGES.map((range, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(range.min.toString(), range.max ? range.max.toString() : null)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isRangeSelected(range.min, range.max)
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {range.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-sm text-brand-text-weak hover:text-brand-text-strong underline"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          {showCustomInput ? "Hide custom range" : "Enter custom range"}
        </button>
        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 flex-1">
            <input
              type="text"
              value={customSalary}
              onChange={(e) => setCustomSalary(e.target.value)}
              placeholder="e.g., 50000-100000"
              className="flex-1 px-3 py-1.5 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder text-sm"
              style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors text-sm"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Apply
            </button>
          </form>
        )}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-brand-text-weak hover:text-brand-text-strong underline"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        Skip
      </button>
    </div>
  );
}
