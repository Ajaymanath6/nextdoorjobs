"use client";

import { useState } from "react";
import Modal from "./Modal";
import { SERVICE_TYPES } from "../../lib/constants/serviceTypes";

const inputClass =
  "w-full rounded-md border border-brand-stroke-strong focus:border-brand-text-strong focus:outline-none focus:ring-0 text-brand-text-strong placeholder:text-brand-text-placeholder px-3 py-2";

export default function RequestGigModal({ isOpen, onClose }) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/gig-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: category.trim(),
          title: title.trim(),
          description: description.trim(),
          deadline: deadline.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      const count = data.recipientsCount ?? 0;
      if (count === 0) {
        setSuccessMessage(
          "Request saved. No gig workers in this category right now; we'll notify you when someone signs up."
        );
      } else {
        setSuccessMessage(`Request sent to ${count} gig worker${count === 1 ? "" : "s"}.`);
      }
      setCategory("");
      setTitle("");
      setDescription("");
      setDeadline("");
      setLocation("");
      setTimeout(() => {
        onClose();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      setSuccessMessage("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div
        className="fixed inset-0 z-[1002] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-gig-title"
      >
        <div
          className="bg-white rounded-lg border border-brand-stroke-weak shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-brand-stroke-weak">
            <h2 id="request-gig-title" className="text-lg font-semibold text-brand-text-strong">
              Request a gig
            </h2>
            <p className="text-sm text-brand-text-weak mt-1">
              Describe what you need; gig workers in that category will get an email and can reply with a quote.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="request-gig-category" className="block text-sm font-medium text-brand-text-strong mb-1">
                Category *
              </label>
              <select
                id="request-gig-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a category</option>
                {SERVICE_TYPES.filter((t) => t !== "Other").map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-gig-title" className="block text-sm font-medium text-brand-text-strong mb-1">
                Title / summary *
              </label>
              <input
                id="request-gig-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Paint living room"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="request-gig-description" className="block text-sm font-medium text-brand-text-strong mb-1">
                Description *
              </label>
              <textarea
                id="request-gig-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I need someone to paint my living room by next Friday. Prefer eco-friendly paint."
                className={inputClass}
                rows={4}
                required
              />
            </div>
            <div>
              <label htmlFor="request-gig-deadline" className="block text-sm font-medium text-brand-text-strong mb-1">
                Deadline (optional)
              </label>
              <input
                id="request-gig-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="request-gig-location" className="block text-sm font-medium text-brand-text-strong mb-1">
                Location (optional)
              </label>
              <input
                id="request-gig-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kochi, Kerala"
                className={inputClass}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-green-600" role="status">
                {successMessage}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-brand text-brand-bg-white px-4 py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
              >
                {loading ? "Sending…" : "Submit request"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-md border border-brand-stroke-weak text-brand-text-strong px-4 py-2 text-sm font-medium hover:bg-brand-bg-fill disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
