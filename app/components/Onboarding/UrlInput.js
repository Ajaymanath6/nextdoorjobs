"use client";

import { useState } from "react";

export default function UrlInput({ onUrlSubmit, placeholder = "Enter URL...", onSkip }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      // Add https:// if not present
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      onUrlSubmit(finalUrl);
      setUrl("");
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onUrlSubmit("skip");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder"
          style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
        >
          Submit
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 border border-brand-stroke-weak text-brand-text-strong rounded-lg hover:bg-brand-bg-fill transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
          >
            Skip
          </button>
        )}
      </div>
    </form>
  );
}
