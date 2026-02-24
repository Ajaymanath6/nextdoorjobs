"use client";

import { useState, useRef, useEffect } from "react";
import { RiSearchLine } from "@remixicon/react";
import themeClasses from "../../theme-utility-classes.json";

const COUNTRY_DISPLAY = { name: "India", flag: "🇮🇳" };

export default function FilterDropdown({
  isOpen,
  onClose,
  dropdownRef,
  position = {
    top: "auto",
    bottom: "auto",
    left: "auto",
    right: "auto",
  },
  width = "300px",
  selectedOption = null,
  onSelect,
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const [searchQuery, setSearchQuery] = useState("");
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const searchInputRef = useRef(null);

  // Fetch all Indian states on mount
  useEffect(() => {
    fetch("/api/india/states")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.states)) setStatesList(data.states);
      })
      .catch(() => setStatesList([]));
  }, []);

  // Initialize with selected option
  useEffect(() => {
    queueMicrotask(() => {
      if (selectedOption && selectedOption.state) {
        setSelectedState(selectedOption.state);
      } else {
        setSelectedState(null);
      }
      if (isOpen) {
        setSearchQuery("");
      }
    });
  }, [selectedOption, isOpen]);

  // Auto-focus search input
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter states based on search
  const filteredStates = statesList.filter((state) =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStateSelect = (state) => {
    setSelectedState(state);
    if (onSelect) {
      onSelect({
        label: `${state}, ${COUNTRY_DISPLAY.name}`,
        country: COUNTRY_DISPLAY.name,
        state: state,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${filterClasses.container} ${filterClasses["container-padding"]} ${filterClasses["container-gap"]} ${filterClasses["container-shadow"]} ${filterClasses["container-max-height"]}`}
      style={{
        width: width,
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        marginTop: position.marginTop || "0",
        marginBottom: position.marginBottom || "0",
        fontFamily: "Open Sans",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Country Display - India only, no dropdown */}
      <div className="flex items-center gap-2 px-3 py-2 border border-brand-stroke-border rounded-lg bg-brand-stroke-weak">
        <span style={{ fontSize: "18px" }}>{COUNTRY_DISPLAY.flag}</span>
        <span className={filterClasses["country-button-text"]}>
          {COUNTRY_DISPLAY.name}
        </span>
      </div>

      {/* Search Input for States */}
      <div className={filterClasses["search-container"]}>
        <RiSearchLine
          size={18}
          className={filterClasses["search-icon"]}
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search states..."
          className={`${filterClasses["search-input"]} ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
          style={{
            fontFamily: "Open Sans",
            fontWeight: 600,
          }}
        />
      </div>

      {/* States List */}
      <div
        className={`${filterClasses["states-list"]} ${filterClasses["states-list-max-height"]}`}
      >
        {filteredStates.length > 0 ? (
          filteredStates.map((state, index) => (
            <button
              key={index}
              onClick={() => handleStateSelect(state)}
              className={filterClasses["state-item"]}
              style={{ fontFamily: "Open Sans" }}
            >
              <span
                className={filterClasses["state-item-text"]}
                style={{
                  fontFamily: "Open Sans",
                  fontWeight: selectedState === state ? 600 : 500,
                }}
              >
                {state}
              </span>
            </button>
          ))
        ) : (
          <div
            className={filterClasses["empty-state"]}
            style={{ fontFamily: "Open Sans" }}
          >
            No states found
          </div>
        )}
      </div>
    </div>
  );
}
