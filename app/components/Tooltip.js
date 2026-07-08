"use client";

const PLACEMENT_CLASSES = {
  bottom:
    "left-1/2 top-full -translate-x-1/2 mt-2",
  right:
    "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Custom tooltip: wraps a trigger element and shows content on hover.
 * Styled with rounded-lg (8px), background text-strong, light text.
 */
export default function Tooltip({
  children,
  content,
  as: As = "div",
  className = "",
  placement = "bottom",
}) {
  const positionClass = PLACEMENT_CLASSES[placement] ?? PLACEMENT_CLASSES.bottom;

  return (
    <As className={`relative inline-flex group ${className}`.trim()}>
      {children}
      {content != null && content !== "" && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-[3000] px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${positionClass}`}
          style={{ backgroundColor: "var(--brand-text-strong)" }}
        >
          {content}
        </span>
      )}
    </As>
  );
}
