"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Fuse from "fuse.js";
import themeClasses from "../../theme-utility-classes.json";

export default function CollegeAutocomplete({
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
  colleges = [],
  onSelect,
  searchQuery = "",
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const brand = themeClasses.brand;
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const fuseRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const itemRefs = useRef([]);

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    if (colleges.length > 0) {
      fuseRef.current = new Fuse(colleges, {
        keys: ["name", "category"],
        threshold: 0.3,
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
      });
    }
  }, [colleges]);

  // Update suggestions when search query changes
  useEffect(() => {
    queueMicrotask(() => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSuggestions([]);
        setSelectedIndex(-1);
        return;
      }

      if (fuseRef.current) {
        const results = fuseRef.current.search(searchQuery);
        // Get top 8 results
        const topResults = results.slice(0, 8).map((result) => result.item);
        setSuggestions(topResults);
        setSelectedIndex(-1);
        itemRefs.current = [];
      }
    });
  }, [searchQuery]);

  const handleSelect = useCallback((college) => {
    if (onSelect) {
      onSelect(college);
    }
    onClose();
  }, [onSelect, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || suggestions.length === 0) {
      queueMicrotask(() => setSelectedIndex(-1));
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          const nextIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          setTimeout(() => {
            if (itemRefs.current[nextIndex] && suggestionsListRef.current) {
              itemRefs.current[nextIndex].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }, 0);
          return nextIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          setTimeout(() => {
            if (itemRefs.current[nextIndex] && suggestionsListRef.current) {
              itemRefs.current[nextIndex].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }, 0);
          return nextIndex;
        });
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, suggestions, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

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
      {/* Suggestions List or empty state */}
      <div
        ref={suggestionsListRef}
        className="autocomplete-suggestions-list"
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {suggestions.length === 0 ? (
          <div
            style={{
              padding: "16px",
              fontSize: "14px",
              color: "var(--brand-text-weak)",
              textAlign: "center",
              fontFamily: "Open Sans",
            }}
          >
            {searchQuery?.trim().length >= 2
              ? "No colleges found"
              : "Keep typing to search"}
          </div>
        ) : suggestions.map((college, index) => (
          <button
            key={`${college.id}-${index}`}
            ref={(el) => {
              if (el) itemRefs.current[index] = el;
            }}
            onClick={() => handleSelect(college)}
            className="hover:bg-brand-stroke-weak transition-colors duration-150"
            style={{
              fontFamily: "Open Sans",
              padding: "10px 16px",
              textAlign: "left",
              border: "none",
              background: selectedIndex === index ? "var(--brand-stroke-weak)" : "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {/* College Name + Locality */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--brand-text-weak)",
                lineHeight: "1.4",
              }}
            >
              {college.name}
              {college.locality && (
                <span style={{ opacity: 0.7, fontWeight: 400 }}>
                  {" "}• {college.locality}
                </span>
              )}
            </div>
            
            {/* Pincode in bold */}
            <div
              style={{
                fontSize: "12px",
                color: "var(--brand-text-weak)",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--brand-text-strong)",
                }}
              >
                {college.pincode}
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
        Select a college or press Enter to search
      </div>
    </div>
  );
}
