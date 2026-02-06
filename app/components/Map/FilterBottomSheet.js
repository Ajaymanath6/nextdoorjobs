"use client";

import { useState, useRef, useEffect } from "react";
import { Close } from "@carbon/icons-react";
import { RiSearchLine } from "@remixicon/react";
import themeClasses from "../../theme-utility-classes.json";
import LocalityAutocomplete from "./LocalityAutocomplete";
import JobTitleAutocomplete from "./JobTitleAutocomplete";

const FILTER_OPTIONS = ["Skills", "Location", "Roles", "Company", "Experience"];

const EXPERIENCE_BANDS = [
  "0–1 years",
  "1–3 years",
  "3–5 years",
  "5+ years",
];

const DEFAULT_SKILLS_LIST = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "SQL",
  "Communication",
  "Leadership",
];

export default function FilterBottomSheet({
  isOpen,
  onClose,
  selectedOption = null,
  onSelect,
  localities = [],
  jobTitles = [],
  colleges = [],
  companies = [],
}) {
  const filterClasses = themeClasses.components.filterDropdown;

  const [activeOption, setActiveOption] = useState("Location");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [selectedLocality, setSelectedLocality] = useState(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [experienceSearchQuery, setExperienceSearchQuery] = useState("");
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [skillsSearchQuery, setSkillsSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [showLocationAutocomplete, setShowLocationAutocomplete] = useState(false);
  const [showRoleAutocomplete, setShowRoleAutocomplete] = useState(false);
  const [showCompanyList, setShowCompanyList] = useState(false);

  const rightPanelRef = useRef(null);
  const locationAutocompleteRef = useRef(null);
  const roleAutocompleteRef = useRef(null);
  const companyListRef = useRef(null);

  useEffect(() => {
    if (selectedOption?.state) {
      setSelectedLocality(null);
    }
    if (isOpen) {
      setLocationSearchQuery("");
      setRoleSearchQuery("");
      setCompanySearchQuery("");
      setExperienceSearchQuery("");
      setSkillsSearchQuery("");
      setShowLocationAutocomplete(false);
      setShowRoleAutocomplete(false);
      setShowCompanyList(false);
    }
  }, [selectedOption, isOpen]);

  const handleApply = () => {
    if (activeOption === "Location" && selectedLocality && onSelect) {
      onSelect({
        label: `${selectedLocality.localityName}, ${selectedLocality.district}`,
        country: "India",
        state: selectedLocality.district,
      });
    } else if (selectedOption && onSelect) {
      onSelect(selectedOption);
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedLocality(null);
    setSelectedJob(null);
    setSelectedCompany(null);
    setSelectedExperience(null);
    setSelectedSkill(null);
    setLocationSearchQuery("");
    setRoleSearchQuery("");
    setCompanySearchQuery("");
    setExperienceSearchQuery("");
    setSkillsSearchQuery("");
    if (onSelect) onSelect(null);
  };

  const filteredCompanies =
    companies.length > 0 && companySearchQuery.trim().length >= 2
      ? companies.filter((c) => {
          const name = (c.name || c.company_name || "").toLowerCase();
          return name.includes(companySearchQuery.toLowerCase().trim());
        })
      : companies;

  const filteredExperience =
    experienceSearchQuery.trim().length >= 1
      ? EXPERIENCE_BANDS.filter((b) =>
          b.toLowerCase().includes(experienceSearchQuery.toLowerCase())
        )
      : EXPERIENCE_BANDS;

  const filteredSkills =
    skillsSearchQuery.trim().length >= 1
      ? DEFAULT_SKILLS_LIST.filter((s) =>
          s.toLowerCase().includes(skillsSearchQuery.toLowerCase())
        )
      : DEFAULT_SKILLS_LIST;

  if (!isOpen) return null;

  const headerTitle = activeOption;

  return (
    <div className="fixed inset-0 z-[1001] md:hidden flex flex-col min-h-screen">
      <div
        className="absolute inset-0 pointer-events-auto bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[100vw] flex-1 flex flex-col bg-brand-bg-white rounded-t-2xl shadow-lg z-[1002] pointer-events-auto mt-[130px] overflow-hidden"
        style={{ fontFamily: "Open Sans" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-brand-stroke-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={24} className="text-brand-stroke-strong" />
            </button>
            <span className="text-base font-semibold text-brand-text-strong">
              {headerTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-text-strong bg-brand-bg-fill hover:opacity-90 transition-opacity"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Body: left options + right content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left section: options with right border */}
          <div className="flex flex-col shrink-0 w-[140px] border-r border-brand-stroke-border overflow-y-auto">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveOption(option)}
                className={`w-full text-left px-3 py-3 text-sm font-medium transition-colors border-b border-brand-stroke-weak last:border-b-0 ${
                  activeOption === option
                    ? "bg-brand-bg-fill text-brand-text-strong"
                    : "text-brand-text-weak hover:bg-brand-bg-fill"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Right section: content by activeOption */}
          <div
            ref={rightPanelRef}
            className="flex-1 flex flex-col min-w-0 overflow-hidden"
          >
            {/* Location */}
            {activeOption === "Location" && (
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <div className="relative shrink-0">
                  <div className={`${filterClasses["search-container"]}`}>
                    <RiSearchLine
                      size={18}
                      className={filterClasses["search-icon"]}
                    />
                    <input
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      onFocus={() => setShowLocationAutocomplete(true)}
                      placeholder="Search location or pincode..."
                      className={`w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
                    />
                  </div>
                  <LocalityAutocomplete
                    isOpen={showLocationAutocomplete}
                    onClose={() => setShowLocationAutocomplete(false)}
                    dropdownRef={locationAutocompleteRef}
                    position={{
                      top: "100%",
                      left: "0",
                      right: "auto",
                      marginTop: "8px",
                    }}
                    width="100%"
                    localities={localities}
                    searchQuery={locationSearchQuery}
                    onSelect={(locality) => {
                      setSelectedLocality(locality);
                      setLocationSearchQuery(
                        `${locality.localityName}, ${locality.district}`
                      );
                      setShowLocationAutocomplete(false);
                    }}
                  />
                </div>
                {selectedLocality && (
                  <div className="mt-2 text-sm text-brand-text-weak">
                    Selected: {selectedLocality.localityName},{" "}
                    {selectedLocality.district}
                  </div>
                )}
              </div>
            )}

            {/* Roles */}
            {activeOption === "Roles" && (
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <div className="relative shrink-0">
                  <div className={`${filterClasses["search-container"]}`}>
                    <RiSearchLine
                      size={18}
                      className={filterClasses["search-icon"]}
                    />
                    <input
                      type="text"
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      onFocus={() => setShowRoleAutocomplete(true)}
                      placeholder="Search roles..."
                      className={`w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
                    />
                  </div>
                  <JobTitleAutocomplete
                    isOpen={showRoleAutocomplete}
                    onClose={() => setShowRoleAutocomplete(false)}
                    dropdownRef={roleAutocompleteRef}
                    position={{
                      top: "100%",
                      left: "0",
                      right: "auto",
                      marginTop: "8px",
                    }}
                    width="100%"
                    jobTitles={jobTitles}
                    searchQuery={roleSearchQuery}
                    onSelect={(job) => {
                      setSelectedJob(job);
                      setRoleSearchQuery(job.title);
                      setShowRoleAutocomplete(false);
                    }}
                  />
                </div>
                {selectedJob && (
                  <div className="mt-2 text-sm text-brand-text-weak">
                    Selected: {selectedJob.title}
                  </div>
                )}
              </div>
            )}

            {/* Company */}
            {activeOption === "Company" && (
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <div className={`relative shrink-0 ${filterClasses["search-container"]}`}>
                  <RiSearchLine
                    size={18}
                    className={filterClasses["search-icon"]}
                  />
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    onFocus={() => setShowCompanyList(true)}
                    placeholder="Search company..."
                    className={`w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
                  />
                </div>
                <div
                  ref={companyListRef}
                  className="flex-1 overflow-y-auto mt-2 rounded-lg border border-brand-stroke-border min-h-0"
                >
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.slice(0, 50).map((company, index) => {
                      const name =
                        company.name || company.company_name || "Unknown";
                      const isSelected =
                        selectedCompany &&
                        (selectedCompany.name || selectedCompany.company_name) ===
                          name;
                      return (
                        <button
                          key={`${name}-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(company);
                            setCompanySearchQuery(name);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            isSelected
                              ? "bg-brand-bg-fill font-semibold text-brand-text-strong"
                              : "hover:bg-brand-bg-fill text-brand-text-weak"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-brand-text-weak">
                      No companies found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience */}
            {activeOption === "Experience" && (
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <div className={`relative shrink-0 ${filterClasses["search-container"]}`}>
                  <RiSearchLine
                    size={18}
                    className={filterClasses["search-icon"]}
                  />
                  <input
                    type="text"
                    value={experienceSearchQuery}
                    onChange={(e) => setExperienceSearchQuery(e.target.value)}
                    placeholder="Search or select experience..."
                    className={`w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
                  />
                </div>
                <div className="flex-1 overflow-y-auto mt-2 rounded-lg border border-brand-stroke-border min-h-0">
                  {filteredExperience.map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => {
                        setSelectedExperience(band);
                        setExperienceSearchQuery(band);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedExperience === band
                          ? "bg-brand-bg-fill font-semibold text-brand-text-strong"
                          : "hover:bg-brand-bg-fill text-brand-text-weak"
                      }`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {activeOption === "Skills" && (
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <div className={`relative shrink-0 ${filterClasses["search-container"]}`}>
                  <RiSearchLine
                    size={18}
                    className={filterClasses["search-icon"]}
                  />
                  <input
                    type="text"
                    value={skillsSearchQuery}
                    onChange={(e) => setSkillsSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className={`w-full h-10 pl-9 pr-3 py-2 rounded-lg border border-brand-stroke-border bg-white text-sm font-medium text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand ${filterClasses["search-input-text"]} ${filterClasses["search-input-placeholder"]}`}
                  />
                </div>
                <div className="flex-1 overflow-y-auto mt-2 rounded-lg border border-brand-stroke-border min-h-0">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSelectedSkill(skill);
                        setSkillsSearchQuery(skill);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedSkill === skill
                          ? "bg-brand-bg-fill font-semibold text-brand-text-strong"
                          : "hover:bg-brand-bg-fill text-brand-text-weak"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
