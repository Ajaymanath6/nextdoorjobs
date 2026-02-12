"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  indiaSuggestions = [],
  onSelect,
  searchQuery = "",
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const brand = themeClasses.brand;
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsListRef = useRef(null);
  const itemRefs = useRef([]);

  const fuseOptions = useMemo(
    () => ({
      keys: ["localityName", "district", "pincode"],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    }),
    []
  );

  // Derive suggestions: Fuse results (Kerala localities) + India place suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const localityResults =
      localities.length > 0
        ? new Fuse(localities, fuseOptions)
            .search(searchQuery)
            .slice(0, 8)
            .map((r) => r.item)
        : [];
    return [...localityResults, ...indiaSuggestions];
  }, [searchQuery, indiaSuggestions, localities, fuseOptions]);

  const clampedIndex =
    selectedIndex >= 0 && selectedIndex < suggestions.length
      ? selectedIndex
      : -1;

  const handleSelect = (locality) => {
    if (onSelect) {
      onSelect(locality);
    }
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || suggestions.length === 0) return;

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
      } else if (e.key === "Enter" && clampedIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(suggestions[clampedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, suggestions, clampedIndex, onClose, onSelect]);

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
              ? "No localities or places found"
              : "Keep typing to search"}
          </div>
        ) : suggestions.map((item, index) => {
          const isIndiaPlace = item.listItemType === "india_place";
          const key = isIndiaPlace
            ? `india-${item.name}-${item.state}-${index}`
            : `${item.pincode}-${index}`;
          return (
            <button
              key={key}
              ref={(el) => {
                if (el) itemRefs.current[index] = el;
              }}
              onClick={() => handleSelect(item)}
              className="hover:bg-brand-stroke-weak transition-colors duration-150"
              style={{
                fontFamily: "Open Sans",
                padding: "10px 16px",
                textAlign: "left",
                border: "none",
                background: clampedIndex === index ? "var(--brand-stroke-weak)" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {isIndiaPlace ? (
                <>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--brand-text-weak)",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--brand-text-weak)",
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{item.state}</span>
                    {item.district && (
                      <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ opacity: 0.7 }}>{item.district}</span>
                      </>
                    )}
                    {item.pincode && (
                      <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--brand-text-strong)",
                          }}
                        >
                          {item.pincode}
                        </span>
                      </>
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        opacity: 0.6,
                        textTransform: "capitalize",
                      }}
                    >
                      {item.type === "state"
                        ? "State"
                        : item.type === "district"
                          ? "District"
                          : "Place"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--brand-text-weak)",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.localityName}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--brand-text-weak)",
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{item.district}</span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--brand-text-strong)",
                      }}
                    >
                      {item.pincode}
                    </span>
                  </div>
                </>
              )}
            </button>
          );
        })}
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

