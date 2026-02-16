"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import themeClasses from "../theme-utility-classes.json";

function parseName(fullName) {
  if (!fullName || typeof fullName !== "string") return { firstName: "", lastName: "" };
  const trimmed = fullName.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace <= 0) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, firstSpace),
    lastName: trimmed.slice(firstSpace + 1).trim(),
  };
}

export default function EditDisplayNameModal({
  isOpen,
  onClose,
  currentName = "",
  onSaved,
}) {
  const { firstName: initialFirst, lastName: initialLast } = parseName(currentName);
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const { firstName: f, lastName: l } = parseName(currentName);
      setFirstName(f);
      setLastName(l);
      setError("");
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
    if (!name) {
      setError("Enter at least a first name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update name");
        return;
      }
      onSaved?.(data.user);
      onClose();
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const brand = themeClasses.brand;
  const inputClasses = themeClasses.components?.input || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="backdrop-blur-sm bg-black/20"
    >
      <div
        className="fixed left-1/2 top-1/2 z-[1002] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-brand-stroke-weak pb-4">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-bg-fill transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={24} className="text-brand-stroke-strong" />
          </button>
          <h2 className={`text-lg font-semibold ${brand.text.strong}`}>
            Edit display name
          </h2>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label
              className={`block text-sm font-medium ${brand.text.weak} mb-1`}
              htmlFor="edit-first-name"
            >
              First name
            </label>
            <input
              id="edit-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${inputClasses.border || "border-brand-stroke-border"} ${inputClasses.focus || ""} ${brand.text.strong}`}
              placeholder="First name"
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${brand.text.weak} mb-1`}
              htmlFor="edit-last-name"
            >
              Second name
            </label>
            <input
              id="edit-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${inputClasses.border || "border-brand-stroke-border"} ${inputClasses.focus || ""} ${brand.text.strong}`}
              placeholder="Second name"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-brand-text-strong text-white hover:opacity-90 disabled:opacity-50`}
          >
            Save
            <ArrowRight size={20} className="shrink-0" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
