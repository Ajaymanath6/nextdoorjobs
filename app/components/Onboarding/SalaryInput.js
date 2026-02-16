"use client";

import { useState } from "react";

const SALARY_OPTIONS = [
  "₹5,000 - ₹10,000",
  "₹10,000 - ₹20,000",
  "₹20,000 - ₹30,000",
  "₹30,000 - ₹50,000",
  "₹50,000+"
];

export default function SalaryInput({ onSubmit, onSkip }) {
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setCustomValue("");
    }
  };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
        Choose a range or enter your own:
      </p>
      
      {/* Suggested options as buttons */}
      <div className="flex flex-wrap gap-2">
        {SALARY_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSubmit(option)}
            className="px-3 py-2 rounded-lg border border-brand-stroke-border bg-brand-bg-white hover:bg-brand-bg-fill text-brand-text-strong text-sm transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="space-y-2">
        <p className="text-xs text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Or enter your own:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="e.g. ₹15,000/month"
            className="flex-1 px-3 py-2 rounded-lg border border-brand-stroke-border text-sm text-brand-text-strong"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim()}
            className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Use
          </button>
        </div>
      </div>

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
