"use client";

import { useState } from "react";

export default function PincodeDropdown({ pincodes = [], onSelect, onSkip }) {
  const [customPincode, setCustomPincode] = useState("");

  const handleCustomSubmit = () => {
    const trimmed = customPincode.trim();
    if (trimmed) {
      onSelect(trimmed);
      setCustomPincode("");
    }
  };

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
        Choose a pincode for this area (or skip):
      </p>
      <div className="flex flex-wrap gap-2">
        {pincodes.slice(0, 4).map((pincode) => (
          <button
            key={pincode}
            type="button"
            onClick={() => onSelect(pincode)}
            className="px-4 py-2 rounded-lg border border-brand-stroke-border bg-brand-bg-white hover:bg-brand-bg-fill text-brand-text-strong text-sm font-medium transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {pincode}
          </button>
        ))}
      </div>
      <p className="text-xs text-brand-text-weak mt-2" style={{ fontFamily: "Open Sans, sans-serif" }}>
        Or enter your own pincode:
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={customPincode}
          onChange={(e) => setCustomPincode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
          placeholder="e.g. 695001"
          maxLength={10}
          className="flex-1 px-3 py-2 rounded-lg border border-brand-stroke-border bg-brand-bg-white text-brand-text-strong text-sm"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        />
        <button
          type="button"
          onClick={handleCustomSubmit}
          disabled={!customPincode.trim()}
          className="px-3 py-2 rounded-lg border border-brand bg-brand text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          Use
        </button>
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
