"use client";

import { useState, useRef, useEffect } from "react";
import { RiSearchLine } from "@remixicon/react";
import themeClasses from "../../theme-utility-classes.json";

/**
 * Single dropdown for Companies view with multiple sections:
 * Work arrangement, Company type, Industry type, Job titles.
 * Renders one section after another; selecting an option updates that filter (dropdown stays open).
 */
export default function CompanyFilterDropdown({
  isOpen,
  onClose,
  dropdownRef,
  position = { top: "auto", bottom: "auto", left: "0", right: "auto", marginTop: "8px" },
  width = "320px",
  sections = [],
}) {
  const filterClasses = themeClasses.components.filterDropdown;
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) queueMicrotask(() => setSearchQuery(""));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
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
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-brand-stroke-weak">
        <span className="text-sm font-semibold text-brand-text-strong" style={{ fontFamily: "Open Sans" }}>
          Companies filters
        </span>
      </div>
      <div className={filterClasses["search-container"]}>
        <RiSearchLine size={18} className={filterClasses["search-icon"]} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className={`${filterClasses["search-input"]} ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
          style={{ fontFamily: "Open Sans", fontWeight: 600 }}
        />
      </div>
      <div className={`${filterClasses["states-list"]} ${filterClasses["states-list-max-height"]} overflow-y-auto`}>
        {sections.map((section) => {
          const q = searchQuery.toLowerCase().trim();
          const filtered =
            q === ""
              ? section.options
              : section.options.filter((opt) => String(opt).toLowerCase().includes(q));
          return (
            <div key={section.id} className="border-b border-brand-stroke-weak last:border-b-0">
              <div className="px-3 py-1.5 text-xs font-semibold text-brand-text-weak uppercase tracking-wide" style={{ fontFamily: "Open Sans" }}>
                {section.title}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (section.onSelect) section.onSelect(null);
                }}
                className={filterClasses["state-item"]}
                style={{ fontFamily: "Open Sans" }}
              >
                <span
                  className={filterClasses["state-item-text"]}
                  style={{ fontFamily: "Open Sans", fontWeight: section.selectedValue === null ? 600 : 500 }}
                >
                  All
                </span>
              </button>
              {filtered.length > 0 ? (
                filtered.map((opt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => section.onSelect && section.onSelect(opt)}
                    className={filterClasses["state-item"]}
                    style={{ fontFamily: "Open Sans" }}
                  >
                    <span
                      className={filterClasses["state-item-text"]}
                      style={{ fontFamily: "Open Sans", fontWeight: section.selectedValue === opt ? 600 : 500 }}
                    >
                      {opt}
                    </span>
                  </button>
                ))
              ) : (
                <div className={filterClasses["empty-state"]} style={{ fontFamily: "Open Sans" }}>
                  No options
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
