"use client";

const TEAM_SIZES = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1000+", label: "1000+" },
];

export default function TeamSizeSelector({ onSelect, onSkip, selectedValue = null }) {
  return (
    <div className="w-full flex flex-col gap-2" data-inline-component>
      <div className="flex flex-wrap gap-2">
        {TEAM_SIZES.map((size) => (
          <button
            key={size.value}
            type="button"
            onClick={() => onSelect(size.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedValue === size.value
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {size.label}
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
