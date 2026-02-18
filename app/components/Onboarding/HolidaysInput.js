"use client";

import { useState } from "react";

export default function HolidaysInput({ onSubmit, onSkip }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    } else if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2" data-inline-component>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., 20 days paid vacation, National holidays"
        className="w-full px-4 py-2 rounded-lg border border-brand-stroke-weak text-brand-text-strong focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-brand text-white rounded-lg font-medium text-sm hover:bg-brand-hover transition-colors"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          {value.trim() ? "Submit" : "Skip"}
        </button>
        {onSkip && value.trim() && (
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
