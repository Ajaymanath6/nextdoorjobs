"use client";

export default function PincodeDropdown({ pincodes = [], onSelect, onSkip }) {
  return (
    <div className="w-full space-y-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-brand-stroke-weak" data-inline-component>
      <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
        Choose a pincode for this area (or skip):
      </p>
      <div className="flex flex-wrap gap-2">
        {pincodes.map((pincode) => (
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
