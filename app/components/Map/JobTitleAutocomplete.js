"use client";

import { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import themeClasses from "../../theme-utility-classes.json";

export default function JobTitleAutocomplete({
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
  jobTitles = [],
  onSelect,
  searchQuery = "",
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const fuseRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const itemRefs = useRef([]);

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    if (jobTitles.length > 0) {
      fuseRef.current = new Fuse(jobTitles, {
        keys: ["title", "category"],
        threshold: 0.3, // Lower = more strict matching
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
      });
    }
  }, [jobTitles]);

  // Update suggestions when search query changes
  useEffect(() => {
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
      setSelectedIndex(-1); // Reset selection when suggestions change
      itemRefs.current = [];
    }
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || suggestions.length === 0) {
      setSelectedIndex(-1);
      return;
    }

    const handleKeyDown = (e) => {
      // Only handle arrow keys and enter when autocomplete is open
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          const nextIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          // Scroll into view
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
          // Scroll into view
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

    // Add event listener with capture to catch events before they reach input
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, suggestions, selectedIndex, onSelect, onClose]);

  const handleSelect = (jobTitle) => {
    if (onSelect) {
      onSelect(jobTitle);
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
        ref={suggestionsListRef}
        className="autocomplete-suggestions-list"
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {suggestions.map((jobTitle, index) => (
          <button
            key={`${jobTitle.id}-${index}`}
            ref={(el) => {
              if (el) itemRefs.current[index] = el;
            }}
            onClick={() => handleSelect(jobTitle)}
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
            {/* Job Title */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--brand-text-weak)",
                lineHeight: "1.4",
              }}
            >
              {jobTitle.title}
            </div>
            
            {/* "near me" label */}
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
                {jobTitle.category}
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--brand-text-strong)",
                }}
              >
                near me
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
        Select a job to find opportunities near you
      </div>
    </div>
  );
}

