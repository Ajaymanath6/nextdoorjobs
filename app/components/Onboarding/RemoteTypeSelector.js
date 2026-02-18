"use client";

const REMOTE_TYPES = [
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "On-site", label: "On-site" },
];

export default function RemoteTypeSelector({ onSelect, onSkip, selectedValue = null }) {
  return (
    <div className="w-full flex flex-col gap-2" data-inline-component>
      <div className="flex flex-wrap gap-2">
        {REMOTE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onSelect(type.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedValue === type.value
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {type.label}
          </button>
        ))}
      </div>
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
  );
}
