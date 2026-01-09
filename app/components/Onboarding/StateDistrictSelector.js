"use client";

import { useState, useRef, useEffect } from "react";
import { INDIAN_STATES, KERALA_DISTRICTS } from "../../../lib/constants/indianStates";

export default function StateDistrictSelector({ 
  onStateSelect, 
  onDistrictSelect, 
  selectedState = null, 
  selectedDistrict = null,
  showDistrict = false 
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

  const filteredStates = INDIAN_STATES.filter((state) =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDistricts = KERALA_DISTRICTS.filter((district) =>
    district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value, type) => {
    if (type === "state") {
      onStateSelect(value);
      setIsOpen(false);
      setSearchQuery("");
    } else {
      onDistrictSelect(value);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={showDistrict ? (selectedDistrict || "") : (selectedState || "")}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={showDistrict ? "Select district..." : "Select state..."}
        className="w-full px-4 py-2 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder"
        style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {(showDistrict ? filteredDistricts : filteredStates).map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(item, showDistrict ? "district" : "state")}
              className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              {item}
            </button>
          ))}
          {(showDistrict ? filteredDistricts : filteredStates).length === 0 && (
            <div className="px-4 py-2 text-sm text-brand-text-weak">
              No {showDistrict ? "districts" : "states"} found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
