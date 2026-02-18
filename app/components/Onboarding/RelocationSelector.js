"use client";

const RELOCATION_OPTIONS = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

export default function RelocationSelector({ onSelect, onSkip, selectedValue = null }) {
  return (
    <div className="w-full flex flex-col gap-2" data-inline-component>
      <div className="flex flex-wrap gap-2">
        {RELOCATION_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedValue === option.value
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {option.label}
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
