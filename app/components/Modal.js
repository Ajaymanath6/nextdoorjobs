"use client";

import { createPortal } from "react-dom";

/**
 * Full-viewport modal: overlay (fixed inset-0, no margins) + content slot.
 * Renders via portal to document.body so overlay is never shrunk by parent padding/margin.
 * @param {string} [overlayClassName] - Optional class for the overlay (e.g. "backdrop-blur-sm bg-black/20")
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  mobileOnly,
  overlayClassName = "bg-black/30",
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[1001] ${mobileOnly ? "md:hidden" : ""}`}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className={`fixed inset-0 ${overlayClassName}`}
        style={{ margin: 0, padding: 0 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden
      />
      {children}
    </div>,
    document.body
  );
}
