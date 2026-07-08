"use client";

import { useState, useEffect } from "react";
import { Close } from "@carbon/icons-react";
import Modal from "../Modal";
import {
  EXPERIENCE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  POSTED_WITHIN_OPTIONS,
} from "../../../lib/jobMapFilters";

export default function JobsMoreFiltersDrawer({
  isOpen,
  onClose,
  initialFilters = {},
  onApply,
  onClearAll,
}) {
  const [experience, setExperience] = useState(initialFilters.experience || null);
  const [companyType, setCompanyType] = useState(initialFilters.companyType || null);
  const [postedWithin, setPostedWithin] = useState(initialFilters.postedWithin || null);

  useEffect(() => {
    if (isOpen) {
      setExperience(initialFilters.experience || null);
      setCompanyType(initialFilters.companyType || null);
      setPostedWithin(initialFilters.postedWithin || null);
    }
  }, [isOpen, initialFilters]);

  const handleClear = () => {
    setExperience(null);
    setCompanyType(null);
    setPostedWithin(null);
    if (onClearAll) {
      onClearAll();
    } else {
      onApply?.({});
    }
    onClose();
  };

  const handleApply = () => {
    onApply?.({
      experience: experience || null,
      companyType: companyType || null,
      postedWithin: postedWithin || null,
    });
    onClose();
  };

  if (!isOpen) return null;

  const chipClass = (active) =>
    `px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
      active
        ? "border-brand bg-brand/10 text-brand"
        : "border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill"
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed left-1/2 top-1/2 z-[1003] flex max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-stroke-weak px-4 py-3">
          <h2 className="text-base font-semibold text-brand-text-strong">More Filters</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-brand-bg-fill" aria-label="Close">
            <Close size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Experience</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={chipClass(experience === opt.label)}
                  onClick={() => setExperience(experience === opt.label ? null : opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Company Type</p>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={chipClass(companyType === opt.label)}
                  onClick={() => setCompanyType(companyType === opt.label ? null : opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Posted Within</p>
            <div className="flex flex-wrap gap-2">
              {POSTED_WITHIN_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={chipClass(postedWithin === opt.label)}
                  onClick={() => setPostedWithin(postedWithin === opt.label ? null : opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-brand-stroke-weak px-4 py-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 px-4 py-2 rounded-md border border-brand-stroke-weak text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}
