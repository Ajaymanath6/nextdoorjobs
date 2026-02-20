"use client";

/**
 * Custom tooltip: wraps a trigger element and shows content on hover.
 * Styled with rounded-lg (8px), background text-strong, light text.
 */
export default function Tooltip({ children, content, as: As = "div", className = "" }) {
  return (
    <As className={`relative inline-flex group ${className}`.trim()}>
      {children}
      {content != null && content !== "" && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "var(--brand-text-strong)" }}
        >
          {content}
        </span>
      )}
    </As>
  );
}
