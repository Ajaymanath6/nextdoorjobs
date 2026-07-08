"use client";

import { Filter } from "@carbon/icons-react";
import { RiArrowDownSLine } from "@remixicon/react";
import OptionListFilterDropdown from "./OptionListFilterDropdown";
import GigFilterDropdown from "./GigFilterDropdown";
import {
  RADIUS_OPTIONS,
  WORK_MODE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SALARY_BANDS,
  GIG_SALARY_BANDS,
} from "../../../lib/jobMapFilters";

function FilterPill({ buttonRef, label, onClick, ariaLabel }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm font-medium transition-colors shrink-0 bg-brand-bg-white border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill cursor-pointer"
      style={{ fontFamily: "Open Sans" }}
      aria-label={ariaLabel}
      title={label}
    >
      <Filter size={16} className="shrink-0" />
      <span className="max-w-[110px] truncate">{label}</span>
      <RiArrowDownSLine size={16} className="shrink-0" />
    </button>
  );
}

export default function JobsFilterBar({
  searchModeForUI,
  accountTypeForUI,
  userAccountType,
  gigs,
  selectedGigType,
  onSelectGigType,
  showGigFilterDropdown,
  setShowGigFilterDropdown,
  gigFilterButtonRef,
  gigFilterDropdownRef,
  selectedGigSalaryBand,
  onSelectGigSalaryBand,
  showGigSalaryDropdown,
  setShowGigSalaryDropdown,
  gigSalaryButtonRef,
  gigSalaryDropdownRef,
  selectedRadiusKm,
  onSelectRadiusKm,
  showRadiusDropdown,
  setShowRadiusDropdown,
  radiusButtonRef,
  radiusDropdownRef,
  selectedWorkMode,
  onSelectWorkMode,
  showWorkModeDropdown,
  setShowWorkModeDropdown,
  workModeButtonRef,
  workModeDropdownRef,
  selectedEmploymentType,
  onSelectEmploymentType,
  showEmploymentDropdown,
  setShowEmploymentDropdown,
  employmentButtonRef,
  employmentDropdownRef,
  selectedIndustryType,
  onSelectIndustryType,
  showIndustryDropdown,
  setShowIndustryDropdown,
  industryButtonRef,
  industryDropdownRef,
  industryCategories,
  selectedRole,
  onSelectRole,
  showRoleDropdown,
  setShowRoleDropdown,
  roleButtonRef,
  roleDropdownRef,
  roleOptions,
  selectedSalaryBand,
  onSelectSalaryBand,
  showSalaryDropdown,
  setShowSalaryDropdown,
  salaryButtonRef,
  salaryDropdownRef,
  onOpenMoreFilters,
  moreFiltersActive,
  candidateYearsOptions,
  selectedYearsExperience,
  onSelectYearsExperience,
  showYearsFilterDropdown,
  setShowYearsFilterDropdown,
  yearsFilterButtonRef,
  yearsFilterDropdownRef,
  candidateToolStackOptions,
  selectedToolStack,
  onSelectToolStack,
  showToolStackFilterDropdown,
  setShowToolStackFilterDropdown,
  toolStackFilterButtonRef,
  toolStackFilterDropdownRef,
  closeOtherDropdowns,
}) {
  const radiusLabel =
    selectedRadiusKm != null
      ? RADIUS_OPTIONS.find((r) => r.value === selectedRadiusKm)?.label || "Radius"
      : "Radius";

  const workModeLabel = selectedWorkMode || "Work Mode";
  const employmentLabel =
    EMPLOYMENT_OPTIONS.find((e) => e.value === selectedEmploymentType)?.label ||
    "Employment";
  const roleLabel = selectedRole || "Role";
  const salaryLabel = selectedSalaryBand || "Salary";

  if (searchModeForUI === "person") {
    return (
      <>
        <div className="relative shrink-0">
          <FilterPill
            buttonRef={gigFilterButtonRef}
            label={selectedGigType || (accountTypeForUI === "Company" ? "Job roles" : "All Gigs")}
            onClick={() => {
              closeOtherDropdowns("gig");
              setShowGigFilterDropdown(!showGigFilterDropdown);
            }}
            ariaLabel="Filter by service type"
          />
          <GigFilterDropdown
            isOpen={showGigFilterDropdown}
            onClose={() => setShowGigFilterDropdown(false)}
            dropdownRef={gigFilterDropdownRef}
            position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
            width="300px"
            selectedGigType={selectedGigType}
            onSelect={onSelectGigType}
            userAccountType={userAccountType}
            gigs={gigs}
          />
        </div>
        {accountTypeForUI === "Individual" && (
          <>
            <div className="relative shrink-0">
              <FilterPill
                buttonRef={radiusButtonRef}
                label={radiusLabel}
                onClick={() => {
                  closeOtherDropdowns("radius");
                  setShowRadiusDropdown(!showRadiusDropdown);
                }}
                ariaLabel="Filter by radius"
              />
              <OptionListFilterDropdown
                isOpen={showRadiusDropdown}
                onClose={() => setShowRadiusDropdown(false)}
                dropdownRef={radiusDropdownRef}
                position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
                width="280px"
                title="Radius"
                allOptionLabel="All distances"
                options={RADIUS_OPTIONS.map((r) => r.label)}
                selectedValue={
                  selectedRadiusKm != null
                    ? RADIUS_OPTIONS.find((r) => r.value === selectedRadiusKm)?.label
                    : null
                }
                onSelect={(label) => {
                  const opt = RADIUS_OPTIONS.find((r) => r.label === label);
                  onSelectRadiusKm(opt ? opt.value : null);
                }}
                searchPlaceholder=""
                emptyMessage=""
              />
            </div>
            <div className="relative shrink-0">
              <FilterPill
                buttonRef={gigSalaryButtonRef}
                label={selectedGigSalaryBand || "Salary"}
                onClick={() => {
                  closeOtherDropdowns("gigSalary");
                  setShowGigSalaryDropdown(!showGigSalaryDropdown);
                }}
                ariaLabel="Filter by gig salary"
              />
              <OptionListFilterDropdown
                isOpen={showGigSalaryDropdown}
                onClose={() => setShowGigSalaryDropdown(false)}
                dropdownRef={gigSalaryDropdownRef}
                position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
                width="280px"
                title="Gig salary"
                allOptionLabel="All"
                options={GIG_SALARY_BANDS}
                selectedValue={selectedGigSalaryBand}
                onSelect={onSelectGigSalaryBand}
                searchPlaceholder=""
                emptyMessage="No options"
              />
            </div>
          </>
        )}
        {accountTypeForUI === "Company" && (
          <>
            <div className="relative shrink-0">
              <FilterPill
                buttonRef={yearsFilterButtonRef}
                label={selectedYearsExperience || "Years"}
                onClick={() => {
                  closeOtherDropdowns("years");
                  setShowYearsFilterDropdown(!showYearsFilterDropdown);
                }}
                ariaLabel="Filter by years of experience"
              />
              <OptionListFilterDropdown
                isOpen={showYearsFilterDropdown}
                onClose={() => setShowYearsFilterDropdown(false)}
                dropdownRef={yearsFilterDropdownRef}
                position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
                width="300px"
                title="Years of experience"
                allOptionLabel="Any"
                options={candidateYearsOptions}
                selectedValue={selectedYearsExperience}
                onSelect={onSelectYearsExperience}
                searchPlaceholder="Search..."
                emptyMessage="No options found"
              />
            </div>
            <div className="relative shrink-0">
              <FilterPill
                buttonRef={toolStackFilterButtonRef}
                label={selectedToolStack || "Tool/stack"}
                onClick={() => {
                  closeOtherDropdowns("toolStack");
                  setShowToolStackFilterDropdown(!showToolStackFilterDropdown);
                }}
                ariaLabel="Filter by tool/stack"
              />
              <OptionListFilterDropdown
                isOpen={showToolStackFilterDropdown}
                onClose={() => setShowToolStackFilterDropdown(false)}
                dropdownRef={toolStackFilterDropdownRef}
                position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
                width="300px"
                title="Tool / stack"
                allOptionLabel="All"
                options={candidateToolStackOptions}
                selectedValue={selectedToolStack}
                onSelect={onSelectToolStack}
                searchPlaceholder="Search tools..."
                emptyMessage="No tools found"
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative shrink-0">
        <FilterPill
          buttonRef={radiusButtonRef}
          label={radiusLabel}
          onClick={() => {
            closeOtherDropdowns("radius");
            setShowRadiusDropdown(!showRadiusDropdown);
          }}
          ariaLabel="Filter by radius"
        />
        <OptionListFilterDropdown
          isOpen={showRadiusDropdown}
          onClose={() => setShowRadiusDropdown(false)}
          dropdownRef={radiusDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="280px"
          title="Radius"
          allOptionLabel="All distances"
          options={RADIUS_OPTIONS.map((r) => r.label)}
          selectedValue={
            selectedRadiusKm != null
              ? RADIUS_OPTIONS.find((r) => r.value === selectedRadiusKm)?.label
              : null
          }
          onSelect={(label) => {
            const opt = RADIUS_OPTIONS.find((r) => r.label === label);
            onSelectRadiusKm(opt ? opt.value : null);
          }}
          searchPlaceholder=""
          emptyMessage=""
        />
      </div>
      <div className="relative shrink-0">
        <FilterPill
          buttonRef={workModeButtonRef}
          label={workModeLabel}
          onClick={() => {
            closeOtherDropdowns("workMode");
            setShowWorkModeDropdown(!showWorkModeDropdown);
          }}
          ariaLabel="Work mode"
        />
        <OptionListFilterDropdown
          isOpen={showWorkModeDropdown}
          onClose={() => setShowWorkModeDropdown(false)}
          dropdownRef={workModeDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="280px"
          title="Work mode"
          allOptionLabel="All"
          options={WORK_MODE_OPTIONS.map((o) => o.label)}
          selectedValue={selectedWorkMode}
          onSelect={onSelectWorkMode}
          searchPlaceholder=""
          emptyMessage=""
        />
      </div>
      <div className="relative shrink-0">
        <FilterPill
          buttonRef={employmentButtonRef}
          label={employmentLabel}
          onClick={() => {
            closeOtherDropdowns("employment");
            setShowEmploymentDropdown(!showEmploymentDropdown);
          }}
          ariaLabel="Employment type"
        />
        <OptionListFilterDropdown
          isOpen={showEmploymentDropdown}
          onClose={() => setShowEmploymentDropdown(false)}
          dropdownRef={employmentDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="280px"
          title="Employment"
          allOptionLabel="All"
          options={EMPLOYMENT_OPTIONS.map((o) => o.label)}
          selectedValue={EMPLOYMENT_OPTIONS.find((e) => e.value === selectedEmploymentType)?.label}
          onSelect={(label) => {
            const opt = EMPLOYMENT_OPTIONS.find((e) => e.label === label);
            onSelectEmploymentType(opt ? opt.value : null);
          }}
          searchPlaceholder=""
          emptyMessage=""
        />
      </div>
      <div className="relative shrink-0">
        <FilterPill
          buttonRef={industryButtonRef}
          label={selectedIndustryType || "Industry"}
          onClick={() => {
            closeOtherDropdowns("industry");
            setShowIndustryDropdown(!showIndustryDropdown);
          }}
          ariaLabel="Industry"
        />
        <OptionListFilterDropdown
          isOpen={showIndustryDropdown}
          onClose={() => setShowIndustryDropdown(false)}
          dropdownRef={industryDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="300px"
          title="Industry"
          allOptionLabel="All"
          options={industryCategories}
          selectedValue={selectedIndustryType}
          onSelect={(v) => {
            onSelectIndustryType(v);
            onSelectRole(null);
          }}
          searchPlaceholder="Search..."
          emptyMessage="No industries found"
        />
      </div>
      <div className={`relative shrink-0 ${!selectedIndustryType ? "opacity-60" : ""}`}>
        <FilterPill
          buttonRef={roleButtonRef}
          label={roleLabel}
          onClick={() => {
            if (!selectedIndustryType) return;
            closeOtherDropdowns("role");
            setShowRoleDropdown(!showRoleDropdown);
          }}
          ariaLabel="Job role"
        />
        <OptionListFilterDropdown
          isOpen={showRoleDropdown && !!selectedIndustryType}
          onClose={() => setShowRoleDropdown(false)}
          dropdownRef={roleDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="300px"
          title="Role"
          allOptionLabel="All"
          options={roleOptions}
          selectedValue={selectedRole}
          onSelect={onSelectRole}
          searchPlaceholder="Search..."
          emptyMessage={selectedIndustryType ? "No roles found" : "Select industry first"}
        />
      </div>
      <div className="relative shrink-0">
        <FilterPill
          buttonRef={salaryButtonRef}
          label={salaryLabel}
          onClick={() => {
            closeOtherDropdowns("salary");
            setShowSalaryDropdown(!showSalaryDropdown);
          }}
          ariaLabel="Salary"
        />
        <OptionListFilterDropdown
          isOpen={showSalaryDropdown}
          onClose={() => setShowSalaryDropdown(false)}
          dropdownRef={salaryDropdownRef}
          position={{ top: "100%", bottom: "auto", left: "0", right: "auto", marginTop: "8px" }}
          width="280px"
          title="Salary"
          allOptionLabel="All"
          options={SALARY_BANDS.map((b) => b.label)}
          selectedValue={selectedSalaryBand}
          onSelect={onSelectSalaryBand}
          searchPlaceholder=""
          emptyMessage=""
        />
      </div>
      <button
        type="button"
        onClick={onOpenMoreFilters}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm font-medium transition-colors shrink-0 hover:bg-brand-bg-fill cursor-pointer ${
          moreFiltersActive
            ? "border-brand bg-brand/10 text-brand"
            : "bg-brand-bg-white border-brand-stroke-weak text-brand-text-strong"
        }`}
        style={{ fontFamily: "Open Sans" }}
      >
        <Filter size={16} className="shrink-0" />
        <span>More Filters</span>
      </button>
    </>
  );
}
