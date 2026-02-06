"use client";

import { useState, useRef, useEffect } from "react";
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
  const suggestionsListRef = useRef(null);
  const itemRefs = useRef([]);

  // Update suggestions when search query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    if (jobTitles.length > 0) {
      // Simple filter - no need for Fuse.js
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const filtered = jobTitles.filter(job => 
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.category.toLowerCase().includes(normalizedQuery)
      );
      
      // Get top 8 results
      const topResults = filtered.slice(0, 8);
      console.log("💼 Job autocomplete suggestions:", { query: searchQuery, count: topResults.length, suggestions: topResults });
      setSuggestions(topResults);
      setSelectedIndex(-1);
      itemRefs.current = [];
    } else {
      console.log("⚠️ Job autocomplete: No job titles available", { jobTitlesCount: jobTitles.length });
      setSuggestions([]);
    }
  }, [searchQuery, jobTitles]);

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

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log("💼 JobTitleAutocomplete render:", { 
        isOpen, 
        suggestionsCount: suggestions.length, 
        jobTitlesCount: jobTitles.length,
        searchQuery 
      });
    }
  }, [isOpen, suggestions.length, jobTitles.length, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${filterClasses.container} ${filterClasses["container-shadow"]}`}
      style={{
        position: "absolute",
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
        zIndex: 1000,
        backgroundColor: "white",
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
              ? "No roles found"
              : "Keep typing to search"}
          </div>
        ) : suggestions.map((jobTitle, index) => (
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

