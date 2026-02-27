"use client";

const EXPERIENCE_RANGES = [
  { value: 1, label: "0–1 years" },
  { value: 2, label: "1–2 years" },
  { value: 3, label: "1–3 years" },
  { value: 4, label: "2–4 years" },
  { value: 5, label: "3–5 years" },
  { value: 6, label: "4–6 years" },
  { value: 7, label: "5–7 years" },
  { value: 8, label: "3–7 years" },
  { value: 10, label: "5–10 years" },
  { value: 14, label: "10–14 years" },
  { value: 15, label: "10+ years" },
  { value: 20, label: "20+ years" },
];

export default function ExperienceRangeSelect({ onSelect, selectedValue = null }) {
  return (
    <div className="w-full flex flex-wrap gap-2" data-inline-component>
      {EXPERIENCE_RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => onSelect(range.value)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            selectedValue === range.value
              ? "bg-brand text-white shadow-md"
              : "bg-brand-bg-white border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill hover:border-brand-stroke-strong"
          }`}
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
