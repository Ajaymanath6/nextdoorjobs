"use client";

import { useState } from "react";
import { Close } from "@carbon/icons-react";
import JobsFiltersPanel from "./JobsFiltersPanel";

const EMPTY_FILTERS = {
  employmentType: null,
  industryType: null,
  role: null,
  salaryBand: null,
  experience: null,
  companyType: null,
  postedWithin: null,
};

function JobsMoreFiltersDrawerInner({
  initialFilters = {},
  industryCategories = [],
  roleOptions = [],
  onIndustryChange,
  onApply,
  onClearAll,
  onClose,
}) {
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    ...initialFilters,
  }));

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS });
    if (onClearAll) {
      onClearAll();
    } else {
      onApply?.({});
    }
    onClose();
  };

  const handleApply = () => {
    onApply?.({
      employmentType: filters.employmentType || null,
      industryType: filters.industryType || null,
      role: filters.role || null,
      salaryBand: filters.salaryBand || null,
      experience: filters.experience || null,
      companyType: filters.companyType || null,
      postedWithin: filters.postedWithin || null,
    });
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[1999] bg-black/20 border-0 cursor-default"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className="fixed top-[32px] right-[32px] bottom-[32px] w-full max-w-[400px] bg-brand-bg-white border border-brand-stroke-weak shadow-lg z-[2000] flex flex-col rounded-[16px] overflow-hidden"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-brand-stroke-weak px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-text-strong">More Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-brand-bg-fill rounded-md transition-colors"
            aria-label="Close"
          >
            <Close size={20} className="text-brand-stroke-strong" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <JobsFiltersPanel
            filters={filters}
            onChange={setFilters}
            industryCategories={industryCategories}
            roleOptions={roleOptions}
            onIndustryChange={onIndustryChange}
            showWorkMode={false}
            showRadius={false}
            layout="compact"
          />
        </div>

        <div className="shrink-0 flex gap-2 border-t border-brand-stroke-weak px-6 py-4">
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
    </>
  );
}

export default function JobsMoreFiltersDrawer({
  isOpen,
  onClose,
  initialFilters = {},
  industryCategories = [],
  roleOptions = [],
  onIndustryChange,
  onApply,
  onClearAll,
}) {
  if (!isOpen) return null;

  return (
    <JobsMoreFiltersDrawerInner
      initialFilters={initialFilters}
      industryCategories={industryCategories}
      roleOptions={roleOptions}
      onIndustryChange={onIndustryChange}
      onApply={onApply}
      onClearAll={onClearAll}
      onClose={onClose}
    />
  );
}
