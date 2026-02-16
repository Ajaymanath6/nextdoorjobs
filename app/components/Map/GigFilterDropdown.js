"use client";

import { useState, useRef, useEffect } from "react";
import { RiSearchLine } from "@remixicon/react";
import themeClasses from "../../theme-utility-classes.json";
import { SERVICE_TYPES } from "../../../lib/constants/serviceTypes";

export default function GigFilterDropdown({
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
  selectedGigType = null,
  onSelect,
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Reset search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Auto-focus search input
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter service types based on search
  const filteredTypes = SERVICE_TYPES.filter((type) =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTypeSelect = (type) => {
    if (onSelect) {
      onSelect(type);
    }
    onClose();
  };

  const handleClearFilter = () => {
    if (onSelect) {
      onSelect(null);
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
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-brand-stroke-weak">
        <span className="text-sm font-semibold text-brand-text-strong" style={{ fontFamily: "Open Sans" }}>
          Filter by Service Type
        </span>
        {selectedGigType && (
          <button
            onClick={handleClearFilter}
            className="text-xs font-medium text-brand hover:text-brand-hover transition-colors"
            style={{ fontFamily: "Open Sans" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Input */}
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
          placeholder="Search service types..."
          className={`${filterClasses["search-input"]} ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
          style={{
            fontFamily: "Open Sans",
            fontWeight: 600,
          }}
        />
      </div>

      {/* Service Types List */}
      <div
        className={`${filterClasses["states-list"]} ${filterClasses["states-list-max-height"]}`}
      >
        {/* All Gigs option */}
        <button
          onClick={handleClearFilter}
          className={filterClasses["state-item"]}
          style={{ fontFamily: "Open Sans" }}
        >
          <span
            className={filterClasses["state-item-text"]}
            style={{
              fontFamily: "Open Sans",
              fontWeight: selectedGigType === null ? 600 : 500,
            }}
          >
            All Gigs
          </span>
        </button>

        {/* Filtered service types */}
        {filteredTypes.length > 0 ? (
          filteredTypes.map((type, index) => (
            <button
              key={index}
              onClick={() => handleTypeSelect(type)}
              className={filterClasses["state-item"]}
              style={{ fontFamily: "Open Sans" }}
            >
              <span
                className={filterClasses["state-item-text"]}
                style={{
                  fontFamily: "Open Sans",
                  fontWeight: selectedGigType === type ? 600 : 500,
                }}
              >
                {type}
              </span>
            </button>
          ))
        ) : (
          <div
            className={filterClasses["empty-state"]}
            style={{ fontFamily: "Open Sans" }}
          >
            No service types found
          </div>
        )}
      </div>
    </div>
  );
}
