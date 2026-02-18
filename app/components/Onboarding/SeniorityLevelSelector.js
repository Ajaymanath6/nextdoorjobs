"use client";

const SENIORITY_LEVELS = [
  { value: "Internship", label: "Internship" },
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior Level", label: "Senior Level" },
  { value: "Lead", label: "Lead" },
  { value: "Manager", label: "Manager" },
  { value: "Director", label: "Director" },
  { value: "VP", label: "VP" },
  { value: "C-Level", label: "C-Level" },
];

export default function SeniorityLevelSelector({ onSelect, onSkip, selectedValue = null }) {
  return (
    <div className="w-full flex flex-col gap-2" data-inline-component>
      <div className="flex flex-wrap gap-2">
        {SENIORITY_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onSelect(level.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedValue === level.value
                ? "bg-brand text-white shadow-md"
                : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            {level.label}
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
