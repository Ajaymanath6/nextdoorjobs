"use client";

import { useState, useRef, useEffect } from "react";
import { RiSearchLine } from "@remixicon/react";
import themeClasses from "../../theme-utility-classes.json";

/**
 * Reusable filter dropdown for a list of options (e.g. years of experience, tool/stack).
 * Same styling as GigFilterDropdown / FilterDropdown; use with theme filterDropdown classes.
 *
 * Selection uses onMouseDown (not click) so document-level outside-click handlers that listen
 * for mousedown cannot close/unmount the menu before the option is applied.
 */
export default function OptionListFilterDropdown({
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
  title,
  allOptionLabel = "All",
  options = [],
  selectedValue = null,
  onSelect,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setSearchQuery(""));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current && searchPlaceholder) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchPlaceholder]);

  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (event, value) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (onSelect) onSelect(value);
    onClose();
  };

  if (!isOpen) return null;

  const showSearch = Boolean(searchPlaceholder);

  return (
    <div
      ref={dropdownRef}
      data-filter-dropdown-menu="true"
      className={`${filterClasses.container} ${filterClasses["container-padding"]} ${filterClasses["container-gap"]} ${filterClasses["container-shadow"]} ${filterClasses["container-max-height"]}`}
      style={{
        width,
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
      onMouseDown={(e) => {
        // Keep clicks inside the menu from being treated as "outside"
        e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-brand-stroke-weak">
        <span className="text-sm font-semibold text-brand-text-strong" style={{ fontFamily: "Open Sans" }}>
          {title}
        </span>
        {selectedValue && (
          <button
            type="button"
            onMouseDown={(e) => handleSelect(e, null)}
            className="text-xs font-medium text-brand hover:text-brand-hover transition-colors"
            style={{ fontFamily: "Open Sans" }}
          >
            Clear
          </button>
        )}
      </div>
      {showSearch && (
        <div className={filterClasses["search-container"]}>
          <RiSearchLine size={18} className={filterClasses["search-icon"]} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={`${filterClasses["search-input"]} ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
            style={{ fontFamily: "Open Sans", fontWeight: 600 }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={`${filterClasses["states-list"]} ${filterClasses["states-list-max-height"]}`}>
        <button
          type="button"
          onMouseDown={(e) => handleSelect(e, null)}
          className={filterClasses["state-item"]}
          style={{ fontFamily: "Open Sans" }}
        >
          <span
            className={filterClasses["state-item-text"]}
            style={{ fontFamily: "Open Sans", fontWeight: selectedValue === null ? 600 : 500 }}
          >
            {allOptionLabel}
          </span>
        </button>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => handleSelect(e, opt)}
              className={filterClasses["state-item"]}
              style={{ fontFamily: "Open Sans" }}
            >
              <span
                className={filterClasses["state-item-text"]}
                style={{ fontFamily: "Open Sans", fontWeight: selectedValue === opt ? 600 : 500 }}
              >
                {opt}
              </span>
            </button>
          ))
        ) : (
          <div className={filterClasses["empty-state"]} style={{ fontFamily: "Open Sans" }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
