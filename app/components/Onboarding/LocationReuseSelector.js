"use client";

import { useState } from "react";
import { Location, ChevronDown, ChevronUp } from "@carbon/icons-react";
import GetCoordinatesButton from "./GetCoordinatesButton";

export default function LocationReuseSelector({ 
  existingLocation, 
  onUseExisting, 
  onAddNew 
}) {
  const [showNewOptions, setShowNewOptions] = useState(false);

  return (
    <div className="space-y-3">
      {/* Use Existing Location Button */}
      <button
        onClick={onUseExisting}
        className="w-full flex items-center justify-between px-4 py-3 border border-brand-stroke-border rounded-lg hover:bg-brand-bg-fill transition-colors"
      >
        <div className="flex items-center gap-2">
          <Location size={20} className="text-brand" />
          <div className="text-left">
            <p className="text-sm font-medium text-brand-text-strong">
              Use existing location
            </p>
            <p className="text-xs text-brand-text-weak">
              {existingLocation.district || "Unknown"}, {existingLocation.state || "Unknown"}
            </p>
          </div>
        </div>
      </button>

      {/* Add New Location (Collapsible) */}
      <div className="border border-brand-stroke-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowNewOptions(!showNewOptions)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-bg-fill transition-colors"
        >
          <span className="text-sm font-medium text-brand-text-strong">
            Add new location
          </span>
          {showNewOptions ? (
            <ChevronUp size={20} className="text-brand-stroke-strong" />
          ) : (
            <ChevronDown size={20} className="text-brand-stroke-strong" />
          )}
        </button>
        
        {showNewOptions && (
          <div className="px-4 pb-4 pt-2 border-t border-brand-stroke-weak">
            <GetCoordinatesButton
              onCoordinatesReceived={onAddNew}
              onSkip={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
