"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const PLACEMENT_CLASSES = {
  bottom: "left-1/2 top-full -translate-x-1/2 mt-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Custom tooltip: wraps a trigger element and shows content on hover.
 * Right placement uses a portal so labels are not clipped by sidebar overflow.
 */
export default function Tooltip({
  children,
  content,
  as: As = "div",
  className = "",
  placement = "bottom",
}) {
  const triggerRef = useRef(null);
  const [portalCoords, setPortalCoords] = useState(null);
  const usePortal = placement === "right" && content;

  const showPortal = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPortalCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  }, []);

  const hidePortal = useCallback(() => setPortalCoords(null), []);

  const positionClass = PLACEMENT_CLASSES[placement] ?? PLACEMENT_CLASSES.bottom;
  const hasContent = content != null && content !== "";

  const portalTooltip =
    usePortal &&
    hasContent &&
    portalCoords &&
    typeof document !== "undefined" &&
    createPortal(
      <span
        role="tooltip"
        className="pointer-events-none fixed z-[5000] -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap shadow-md"
        style={{
          top: portalCoords.top,
          left: portalCoords.left,
          backgroundColor: "var(--brand-text-strong)",
        }}
      >
        {content}
      </span>,
      document.body
    );

  return (
    <>
      <As
        ref={triggerRef}
        className={`relative inline-flex group ${className}`.trim()}
        onMouseEnter={usePortal && hasContent ? showPortal : undefined}
        onMouseLeave={usePortal && hasContent ? hidePortal : undefined}
        onFocus={usePortal && hasContent ? showPortal : undefined}
        onBlur={usePortal && hasContent ? hidePortal : undefined}
      >
        {children}
        {hasContent && !usePortal && (
          <span
            role="tooltip"
            className={`pointer-events-none absolute z-[3000] px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${positionClass}`}
            style={{ backgroundColor: "var(--brand-text-strong)" }}
          >
            {content}
          </span>
        )}
      </As>
      {portalTooltip}
    </>
  );
}
