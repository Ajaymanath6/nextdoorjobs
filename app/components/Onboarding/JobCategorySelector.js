"use client";

import { useState, useRef, useEffect } from "react";
import { JOB_CATEGORIES } from "../../../lib/constants/jobCategories";

export default function JobCategorySelector({ 
  onCategorySelect, 
  selectedCategory = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCategories = JOB_CATEGORIES.filter((category) =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value) => {
    onCategorySelect(value);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={selectedCategory ? JOB_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory : ""}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Select job category..."
        className="w-full px-4 py-2 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder"
        style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCategories.map((category, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(category.value)}
              className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              {category.label}
            </button>
          ))}
          {filteredCategories.length === 0 && (
            <div className="px-4 py-2 text-sm text-brand-text-weak">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
