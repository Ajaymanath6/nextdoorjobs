"use client";

import { useState } from "react";
import { SERVICE_TYPES } from "../../../lib/constants/serviceTypes";

export default function ServiceTypeSelector({ onSelect, onSkip }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  
  const filteredTypes = SERVICE_TYPES.filter(type =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (type) => {
    if (type === "Other") {
      setShowCustomInput(true);
    } else {
      onSelect(type);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onSelect(trimmed);
      setCustomValue("");
    }
  };

  if (showCustomInput) {
    return (
      <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
        <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Enter your service type:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="e.g. Singing, Tailoring"
            autoFocus
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
        <button
          type="button"
          onClick={() => setShowCustomInput(false)}
          className="text-sm text-brand-text-weak hover:text-brand-text-strong underline w-full text-center"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          Back to categories
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
        Choose a service category or search:
      </p>
      
      {/* Search input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search categories..."
        className="w-full px-3 py-2 rounded-lg border border-brand-stroke-border text-sm text-brand-text-strong"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      />

      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {filteredTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleSelect(type)}
            className="px-3 py-2 rounded-lg border border-brand-stroke-border bg-brand-bg-white hover:bg-brand-bg-fill text-brand-text-strong text-sm font-medium transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {type}
          </button>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <p className="text-xs text-brand-text-weak text-center" style={{ fontFamily: "Open Sans, sans-serif" }}>
          No categories found. Try a different search or click "Other" to enter custom.
        </p>
      )}

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
