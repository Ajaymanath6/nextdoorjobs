"use client";

import Modal from "./Modal";
import { WarningAlt } from "@carbon/icons-react";
import themeClasses from "../theme-utility-classes.json";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this gig?",
  message = "This will remove the gig from all instances, database, and the map. This cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}) {
  const brand = themeClasses.brand;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="backdrop-blur-sm bg-black/30"
    >
      <div
        className="fixed left-1/2 top-1/2 z-[1002] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <WarningAlt size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${brand.text.strong} mb-2`}>
              {title}
            </h2>
            <p className={`text-sm ${brand.text.weak}`}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border border-brand-stroke-border ${brand.text.strong} hover:bg-brand-bg-fill transition-colors text-sm font-medium`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
