"use client";

import { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import themeClasses from "../../theme-utility-classes.json";

export default function LocalityAutocomplete({
  isOpen,
  onClose,
  dropdownRef,
  position = {
    top: "auto",
    bottom: "auto",
    left: "auto",
    right: "auto",
  },
  width = "400px",
  localities = [],
  onSelect,
  searchQuery = "",
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const brand = themeClasses.brand;
  const [suggestions, setSuggestions] = useState([]);
  const fuseRef = useRef(null);

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    if (localities.length > 0) {
      fuseRef.current = new Fuse(localities, {
        keys: ["localityName", "district", "pincode"],
        threshold: 0.3, // Lower = more strict matching
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
      });
    }
  }, [localities]);

  // Update suggestions when search query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (fuseRef.current) {
      const results = fuseRef.current.search(searchQuery);
      // Get top 8 results
      const topResults = results.slice(0, 8).map((result) => result.item);
      setSuggestions(topResults);
    }
  }, [searchQuery]);

  const handleSelect = (locality) => {
    if (onSelect) {
      onSelect(locality);
    }
    onClose();
  };

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${filterClasses.container} ${filterClasses["container-shadow"]}`}
      style={{
        width: width,
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        marginTop: position.marginTop || "8px",
        fontFamily: "Open Sans",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "320px",
        padding: "8px 0",
      }}
    >
      {/* Suggestions List */}
      <div
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {suggestions.map((locality, index) => (
          <button
            key={`${locality.pincode}-${index}`}
            onClick={() => handleSelect(locality)}
            className="hover:bg-brand-stroke-weak transition-colors duration-150"
            style={{
              fontFamily: "Open Sans",
              padding: "10px 16px",
              textAlign: "left",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {/* Locality Name */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--brand-text-weak)",
                lineHeight: "1.4",
              }}
            >
              {locality.localityName}
            </div>
            
            {/* District and Pincode */}
            <div
              style={{
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--brand-text-weak)",
              }}
            >
              <span style={{ opacity: 0.7 }}>
                {locality.district}
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--brand-text-strong)",
                }}
              >
                {locality.pincode}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: "8px 16px",
          fontSize: "11px",
          color: "var(--brand-text-weak)",
          opacity: 0.6,
          borderTop: "1px solid var(--brand-stroke-weak)",
          marginTop: "4px",
          fontFamily: "Open Sans",
        }}
      >
        Select a location or press Enter to search
      </div>
    </div>
  );
}

