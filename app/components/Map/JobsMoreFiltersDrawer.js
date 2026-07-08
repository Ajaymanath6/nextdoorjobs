"use client";

import { useState, useEffect } from "react";
import { Close } from "@carbon/icons-react";
import {
  EXPERIENCE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  POSTED_WITHIN_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SALARY_BANDS,
} from "../../../lib/jobMapFilters";

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
  const [employmentType, setEmploymentType] = useState(initialFilters.employmentType || null);
  const [industryType, setIndustryType] = useState(initialFilters.industryType || null);
  const [role, setRole] = useState(initialFilters.role || null);
  const [salaryBand, setSalaryBand] = useState(initialFilters.salaryBand || null);
  const [experience, setExperience] = useState(initialFilters.experience || null);
  const [companyType, setCompanyType] = useState(initialFilters.companyType || null);
  const [postedWithin, setPostedWithin] = useState(initialFilters.postedWithin || null);

  useEffect(() => {
    if (isOpen) {
      setEmploymentType(initialFilters.employmentType || null);
      setIndustryType(initialFilters.industryType || null);
      setRole(initialFilters.role || null);
      setSalaryBand(initialFilters.salaryBand || null);
      setExperience(initialFilters.experience || null);
      setCompanyType(initialFilters.companyType || null);
      setPostedWithin(initialFilters.postedWithin || null);
    }
  }, [isOpen, initialFilters]);

  useEffect(() => {
    if (industryType) {
      onIndustryChange?.(industryType);
    }
  }, [industryType, onIndustryChange]);

  const handleClear = () => {
    setEmploymentType(null);
    setIndustryType(null);
    setRole(null);
    setSalaryBand(null);
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
      employmentType: employmentType || null,
      industryType: industryType || null,
      role: role || null,
      salaryBand: salaryBand || null,
      experience: experience || null,
      companyType: companyType || null,
      postedWithin: postedWithin || null,
    });
    onClose();
  };

  const chipClass = (active) =>
    `px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
      active
        ? "border-brand bg-brand/10 text-brand"
        : "border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill"
    }`;

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[1999] bg-black/20 border-0 cursor-default"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-screen w-full max-w-[400px] bg-brand-bg-white border-l border-brand-stroke-weak shadow-lg z-[2000] flex flex-col"
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

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Employment</p>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={chipClass(employmentType === opt.value)}
                  onClick={() =>
                    setEmploymentType(employmentType === opt.value ? null : opt.value)
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Industry</p>
            <div className="flex flex-wrap gap-2">
              {(industryCategories || []).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={chipClass(industryType === cat)}
                  onClick={() => {
                    const next = industryType === cat ? null : cat;
                    setIndustryType(next);
                    setRole(null);
                    onIndustryChange?.(next);
                  }}
                >
                  {cat}
                </button>
              ))}
              {(!industryCategories || industryCategories.length === 0) && (
                <p className="text-xs text-brand-text-weak">No industries loaded</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">
              Role {industryType ? "" : "(select industry first)"}
            </p>
            <div className="flex flex-wrap gap-2">
              {(roleOptions || []).map((title) => (
                <button
                  key={title}
                  type="button"
                  className={chipClass(role === title)}
                  onClick={() => setRole(role === title ? null : title)}
                >
                  {title}
                </button>
              ))}
              {industryType && (!roleOptions || roleOptions.length === 0) && (
                <p className="text-xs text-brand-text-weak">No roles for this industry</p>
              )}
              {!industryType && (
                <p className="text-xs text-brand-text-weak">Choose an industry to see roles</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Salary</p>
            <div className="flex flex-wrap gap-2">
              {SALARY_BANDS.map((band) => (
                <button
                  key={band.label}
                  type="button"
                  className={chipClass(salaryBand === band.label)}
                  onClick={() =>
                    setSalaryBand(salaryBand === band.label ? null : band.label)
                  }
                >
                  {band.label}
                </button>
              ))}
            </div>
          </div>

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
                  onClick={() =>
                    setCompanyType(companyType === opt.label ? null : opt.label)
                  }
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
                  onClick={() =>
                    setPostedWithin(postedWithin === opt.label ? null : opt.label)
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
