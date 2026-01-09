"use client";

import { FUNDING_SERIES } from "../../../lib/constants/jobCategories";

export default function FundingSeriesBadges({ onSelect, onSkip, selectedValue = null }) {
  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak">
      <div className="flex flex-wrap gap-2">
        {FUNDING_SERIES.map((series) => (
          <button
            key={series.value}
            type="button"
            onClick={() => onSelect(series.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedValue === series.value
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {series.label}
          </button>
        ))}
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
