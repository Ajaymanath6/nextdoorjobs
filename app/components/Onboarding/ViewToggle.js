"use client";

import { useRouter } from "next/navigation";
import { EarthFilled, Chat, ArrowRight, ArrowLeft } from "@carbon/icons-react";
import { useState } from "react";
import LoadingSpinner from "../LoadingSpinner";

export default function ViewToggle({ currentView = "chat" }) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleMapClick = () => {
    setIsSwitching(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  if (isSwitching) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex bg-white border border-brand-stroke-border overflow-hidden rounded-full">
        <button
          type="button"
          onClick={handleMapClick}
          aria-label="Map view"
          className="flex items-center gap-1.5 px-3 py-2 border-0 hover:bg-brand-bg-fill transition-colors rounded-l-full"
        >
          <ArrowLeft size={16} className="w-4 h-4 shrink-0 text-brand-stroke-strong" />
          <EarthFilled size={20} className="w-5 h-5 shrink-0 text-brand-stroke-strong" />
          <span className="text-sm font-medium text-brand-text-weak">Map</span>
        </button>
        <button
          type="button"
          aria-label="Chat view"
          className="flex items-center gap-1.5 px-3 py-2 border-0 bg-brand-bg-fill rounded-r-full"
          disabled
        >
          <Chat size={20} className="w-5 h-5 shrink-0 text-brand" />
          <span className="text-sm font-medium text-brand-text-strong">Chat</span>
          <ArrowRight size={16} className="w-4 h-4 shrink-0 text-brand" />
        </button>
      </div>
    </div>
  );
}
