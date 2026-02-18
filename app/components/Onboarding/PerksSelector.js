"use client";

import { useState } from "react";

const PERKS_OPTIONS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "Life Insurance",
  "Paid Time Off",
  "Sick Leave",
  "Parental Leave",
  "Retirement Plan (401k/PF)",
  "Stock Options",
  "Flexible Hours",
  "Remote Work",
  "Gym Membership",
  "Free Meals",
  "Learning & Development Budget",
  "Commuter Benefits",
];

export default function PerksSelector({ onSelect, onSkip, selectedValues = [] }) {
  const [selected, setSelected] = useState(selectedValues);

  const togglePerk = (perk) => {
    const newSelected = selected.includes(perk)
      ? selected.filter((p) => p !== perk)
      : [...selected, perk];
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    onSelect(selected);
  };

  return (
    <div className="w-full flex flex-col gap-3" data-inline-component>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PERKS_OPTIONS.map((perk) => (
          <button
            key={perk}
            type="button"
            onClick={() => togglePerk(perk)}
            className={`px-3 py-2 rounded-lg font-medium text-sm text-left transition-all ${
              selected.includes(perk)
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {perk}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.length === 0}
          className="px-4 py-2 bg-brand text-white rounded-lg font-medium text-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          Confirm ({selected.length} selected)
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-brand-text-weak hover:text-brand-text-strong underline"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
