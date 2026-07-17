"use client";

import { useState, useEffect, useRef } from "react";
import { CaretDown } from "@phosphor-icons/react";
import {
  RADIUS_OPTIONS,
  WORK_MODE_OPTIONS,
  EXPERIENCE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  POSTED_WITHIN_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SALARY_BANDS,
} from "../../../lib/jobMapFilters";

export function chipClass(active) {
  return `p-1 rounded-full text-sm border cursor-pointer transition-colors ${
    active
      ? "border-brand bg-brand/10 text-brand"
      : "border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill"
  }`;
}

const triggerClass =
  "w-full flex items-center justify-between gap-2 rounded-md border border-brand-stroke-weak bg-brand-bg-white p-1 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors text-left";

function FilterSelect({ label, value, onChange, options, placeholder = "Any", disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const normalized = (options || []).map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const selectedLabel =
    value == null || value === ""
      ? null
      : normalized.find((o) => o.value === value)?.label || value;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <p className="text-sm font-medium text-brand-text-strong mb-2">{label}</p>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`${triggerClass} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`truncate px-1 ${selectedLabel ? "text-brand-text-strong" : "text-brand-text-placeholder"}`}>
          {selectedLabel || placeholder}
        </span>
        <CaretDown size={16} className="shrink-0 text-brand-stroke-strong" />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[200] max-h-[240px] overflow-y-auto rounded-lg border border-brand-stroke-weak bg-brand-bg-white shadow-md py-1">
          <button
            type="button"
            className="w-full block text-left py-2 px-[4px] text-sm text-brand-text-weak hover:bg-brand-bg-fill transition-colors"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            {placeholder}
          </button>
          {normalized.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full block text-left py-2 px-[4px] text-sm transition-colors hover:bg-brand-bg-fill ${
                value === opt.value
                  ? "font-semibold text-brand-text-strong"
                  : "font-medium text-brand-text-weak"
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
          {normalized.length === 0 && (
            <div className="py-2 px-[4px] text-sm text-brand-text-weak">{placeholder}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Shared jobs filter panel used by map drawer and Home permanent column.
 * Controlled: parent owns `filters` and handles `onChange`.
 * layout="chips" (default) = pill chips; layout="compact" = dropdowns for long lists.
 */
export default function JobsFiltersPanel({
  filters = {},
  onChange,
  industryCategories = [],
  roleOptions = [],
  onIndustryChange,
  showWorkMode = false,
  showRadius = false,
  layout = "chips",
  className = "",
}) {
  const {
    workMode = null,
    radiusKm = null,
    employmentType = null,
    industryType = null,
    role = null,
    salaryBand = null,
    experience = null,
    companyType = null,
    postedWithin = null,
  } = filters;

  const compact = layout === "compact";

  const update = (patch) => {
    onChange?.({ ...filters, ...patch });
  };

  const toggle = (key, value) => {
    update({ [key]: filters[key] === value ? null : value });
  };

  return (
    <div
      className={`space-y-4 ${className}`.trim()}
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      {showWorkMode && (
        <div>
          <p className="text-sm font-medium text-brand-text-strong mb-2">Work Mode</p>
          <div className="flex flex-wrap gap-2">
            {WORK_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={chipClass(workMode === opt.label)}
                onClick={() => toggle("workMode", opt.label)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showRadius && (
        <div>
          <p className="text-sm font-medium text-brand-text-strong mb-2">Radius</p>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={chipClass(radiusKm === opt.value)}
                onClick={() =>
                  update({ radiusKm: radiusKm === opt.value ? null : opt.value })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {compact ? (
        <>
          <FilterSelect
            label="Employment"
            value={employmentType}
            onChange={(v) => update({ employmentType: v })}
            options={EMPLOYMENT_OPTIONS}
          />
          <FilterSelect
            label="Industry"
            value={industryType}
            onChange={(v) => {
              update({ industryType: v, role: null });
              onIndustryChange?.(v);
            }}
            options={(industryCategories || []).map((cat) => ({
              value: cat,
              label: cat,
            }))}
            placeholder={
              industryCategories?.length ? "Any industry" : "No industries loaded"
            }
          />
          <FilterSelect
            label="Role"
            value={role}
            onChange={(v) => update({ role: v })}
            options={(roleOptions || []).map((title) => ({
              value: title,
              label: title,
            }))}
            placeholder={
              !industryType
                ? "Select industry first"
                : roleOptions?.length
                  ? "Any role"
                  : "No roles for this industry"
            }
            disabled={!industryType}
          />
          <FilterSelect
            label="Salary"
            value={salaryBand}
            onChange={(v) => update({ salaryBand: v })}
            options={SALARY_BANDS.map((b) => ({ value: b.label, label: b.label }))}
          />
          <FilterSelect
            label="Experience"
            value={experience}
            onChange={(v) => update({ experience: v })}
            options={EXPERIENCE_OPTIONS.map((o) => ({
              value: o.label,
              label: o.label,
            }))}
          />
          <FilterSelect
            label="Company Type"
            value={companyType}
            onChange={(v) => update({ companyType: v })}
            options={COMPANY_TYPE_OPTIONS.map((o) => ({
              value: o.label,
              label: o.label,
            }))}
          />
          <FilterSelect
            label="Posted Within"
            value={postedWithin}
            onChange={(v) => update({ postedWithin: v })}
            options={POSTED_WITHIN_OPTIONS.map((o) => ({
              value: o.label,
              label: o.label,
            }))}
          />
        </>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-brand-text-strong mb-2">Employment</p>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={chipClass(employmentType === opt.value)}
                  onClick={() => toggle("employmentType", opt.value)}
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
                    update({ industryType: next, role: null });
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
                  onClick={() => toggle("role", title)}
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
                  onClick={() => toggle("salaryBand", band.label)}
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
                  onClick={() => toggle("experience", opt.label)}
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
                  onClick={() => toggle("companyType", opt.label)}
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
                  onClick={() => toggle("postedWithin", opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
