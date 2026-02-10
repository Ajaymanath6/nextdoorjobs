"use client";

import { useRef } from "react";

export default function LogoPicker({ onLogoSelected, onSkip }) {
  const inputRef = useRef(null);

  const handleAddLogo = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onLogoSelected(file);
    }
    e.target.value = "";
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2" data-inline-component>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose company logo"
      />
      <button
        type="button"
        onClick={handleAddLogo}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
        style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
      >
        Add logo
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="px-4 py-2 border border-brand-stroke-weak text-brand-text-strong rounded-lg hover:bg-brand-bg-fill transition-colors"
        style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
      >
        Skip
      </button>
    </div>
  );
}
