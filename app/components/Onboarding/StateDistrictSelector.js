"use client";

import { useState, useRef, useEffect } from "react";
import { INDIAN_STATES } from "../../../lib/constants/indianStates";

export default function StateDistrictSelector({
  onStateSelect,
  onDistrictSelect,
  selectedState = null,
  selectedDistrict = null,
  showDistrict = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showDistrict || !selectedState) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setDistrictsLoading(true);
    fetch(`/api/india/districts?state=${encodeURIComponent(selectedState)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.districts)) setDistricts(data.districts);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setDistrictsLoading(false);
      });
    return () => { cancelled = true; };
  }, [showDistrict, selectedState]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDistricts = districts.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
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

  const displayValue = showDistrict ? (selectedDistrict || "") : (selectedState || "");
  const placeholder = showDistrict
    ? (selectedState ? "Select district..." : "Select state first")
    : "Select state...";
  const list = showDistrict ? filteredDistricts : filteredStates;
  const emptyMessage = showDistrict
    ? (districtsLoading ? "Loading districts..." : !selectedState ? "Select a state above first." : "No districts found")
    : "No states found";

  return (
    <div className="relative w-full" ref={dropdownRef} data-inline-component>
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchQuery : displayValue}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setSearchQuery(displayValue);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder"
        style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {list.length > 0 ? (
            list.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(item, showDistrict ? "district" : "state")}
                className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors"
                style={{ fontFamily: "Open Sans, sans-serif" }}
              >
                {item}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-brand-text-weak">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
