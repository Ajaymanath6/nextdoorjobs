"use client";

import { useState, useRef, useEffect } from "react";
import { Close } from "@carbon/icons-react";
import { RiSearchLine } from "@remixicon/react";

const countries = [
  { name: "India", flag: "🇮🇳", states: ["Kerala"] },
];

export default function FilterBottomSheet({
  isOpen,
  onClose,
  selectedOption = null,
  onSelect,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingState, setPendingState] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (selectedOption?.state) {
      setPendingState(selectedOption.state);
    } else {
      setPendingState(null);
    }
    if (isOpen) setSearchQuery("");
  }, [selectedOption, isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const selectedCountry = countries[0];
  const filteredStates = selectedCountry?.states
    ? selectedCountry.states.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleApply = () => {
    if (pendingState && onSelect) {
      onSelect({
        label: `${pendingState}, ${selectedCountry.name}`,
        country: selectedCountry.name,
        state: pendingState,
      });
    }
    onClose();
  };

  const handleClear = () => {
    setPendingState(null);
    if (onSelect) onSelect(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] md:hidden flex items-center justify-center p-2 min-h-screen">
      <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={onClose}
          aria-hidden
        />
        <div
          className="relative w-full max-w-[calc(100vw-16px)] max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-lg flex flex-col z-[1002] pointer-events-auto -translate-y-[30%] mx-2"
          style={{ fontFamily: "Open Sans" }}
        >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-brand-stroke-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={24} className="text-brand-stroke-strong" />
            </button>
            <span className="text-base font-semibold text-brand-text-strong">
              Location filter
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-text-strong bg-brand-bg-fill hover:opacity-90 transition-opacity"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Body: two-column grid */}
        <div className="grid grid-cols-2 gap-3 p-4 overflow-auto min-h-0">
          {/* Left column: Location, Roles, Experience */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-text-weak mb-1.5">
                Location
              </p>
              <div className="border border-brand-stroke-border rounded-lg bg-brand-bg-white p-2 flex items-center gap-2">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-sm font-medium text-brand-text-strong">
                  {selectedCountry.name}
                </span>
              </div>
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-brand-stroke-border">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setPendingState(state)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        pendingState === state
                          ? "bg-brand-bg-fill font-semibold text-brand-text-strong"
                          : "bg-white hover:bg-brand-bg-fill text-brand-text-weak"
                      }`}
                    >
                      {state}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-brand-text-weak">
                    No states found
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-text-weak mb-1.5">
                Roles
              </p>
              <div className="rounded-lg border border-brand-stroke-border bg-brand-bg-fill px-3 py-2 text-xs text-brand-text-weak">
                Coming soon
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-text-weak mb-1.5">
                Experience
              </p>
              <div className="rounded-lg border border-brand-stroke-border bg-brand-bg-fill px-3 py-2 text-xs text-brand-text-weak">
                Coming soon
              </div>
            </div>
          </div>

          {/* Right column: search */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-brand-text-weak mb-1.5">
              Search
            </p>
            <div className="relative flex-1 min-h-[40px]">
              <RiSearchLine
                size={18}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search states..."
                className="w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
