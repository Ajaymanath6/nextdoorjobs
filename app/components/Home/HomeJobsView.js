"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  User,
  Gear,
  SignOut,
  Briefcase,
} from "@phosphor-icons/react";
import JobListRow from "./JobListRow";
import JobDetailPanel from "./JobDetailPanel";
import JobsFiltersPanel from "../Map/JobsFiltersPanel";
import JobsFilterBar from "../Map/JobsFilterBar";
import {
  SALARY_BANDS,
  buildJobsFeedQuery,
} from "../../../lib/jobMapFilters";
import { filterByRadius } from "../../../lib/mapDistance";
import { getAvatarUrlById } from "../../../lib/avatars";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";
import { useConfirmApplied } from "../../hooks/useConfirmApplied";

const TABS = [
  { id: "recommended", label: "Recommended" },
  { id: "all", label: "All jobs" },
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
];

const EMPTY_FILTERS = {
  workMode: null,
  radiusKm: null,
  employmentType: null,
  industryType: null,
  role: null,
  salaryBand: null,
  experience: null,
  companyType: null,
  postedWithin: null,
};

function salaryBandFromLabel(label) {
  if (!label) return null;
  return SALARY_BANDS.find((b) => b.label === label) || null;
}

export default function HomeJobsView({ user, loading: userLoading, onOpenSettings }) {
  const router = useRouter();
  const { count: notificationCount } = useUnreadNotificationCount();
  const profileRef = useRef(null);

  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_FILTERS });
  const [industryCategories, setIndustryCategories] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [appliedLoading, setAppliedLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);
  const [showRadiusDropdown, setShowRadiusDropdown] = useState(false);
  const workModeButtonRef = useRef(null);
  const workModeDropdownRef = useRef(null);
  const radiusButtonRef = useRef(null);
  const radiusDropdownRef = useRef(null);
  const selectedJobRef = useRef(null);

  const displayName = user?.name?.trim() || "there";

  const handleFiltersChange = useCallback((next) => {
    setFilters({ ...EMPTY_FILTERS, ...next });
    setActiveTab("all");
  }, []);

  const handleDraftFiltersChange = useCallback((next) => {
    setDraftFilters({ ...EMPTY_FILTERS, ...next });
  }, []);

  const closeOtherDropdowns = useCallback((except) => {
    if (except !== "workMode") setShowWorkModeDropdown(false);
    if (except !== "radius") setShowRadiusDropdown(false);
  }, []);

  const moreFiltersActive = Boolean(
    filters.employmentType ||
      filters.industryType ||
      filters.role ||
      filters.salaryBand ||
      filters.experience ||
      filters.companyType ||
      filters.postedWithin
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!showWorkModeDropdown && !showRadiusDropdown) return;
    const pairs = [
      [workModeDropdownRef, workModeButtonRef, setShowWorkModeDropdown],
      [radiusDropdownRef, radiusButtonRef, setShowRadiusDropdown],
    ];
    const handleClickOutside = (event) => {
      pairs.forEach(([dropdownRef, buttonRef, setter]) => {
        const inDropdown = dropdownRef.current?.contains(event.target);
        const inButton = buttonRef.current?.contains(event.target);
        if (!inDropdown && !inButton) setter(false);
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showWorkModeDropdown, showRadiusDropdown]);

  useEffect(() => {
    fetch("/api/job-titles/categories", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.categories)) {
          setIndustryCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!draftFilters.industryType) {
      setRoleOptions([]);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/job-titles?category=${encodeURIComponent(draftFilters.industryType)}`,
      { credentials: "same-origin" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.titles)
          ? data.titles
          : Array.isArray(data)
            ? data
            : [];
        setRoleOptions(
          list.map((t) => (typeof t === "string" ? t : t.title)).filter(Boolean)
        );
      })
      .catch(() => {
        if (!cancelled) setRoleOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [draftFilters.industryType]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const url = buildJobsFeedQuery({
        workMode: filters.workMode,
        employmentType: filters.employmentType,
        industryCategory: filters.industryType,
        roleTitle: filters.role,
        salaryBand: salaryBandFromLabel(filters.salaryBand),
        moreFilters: {
          experience: filters.experience,
          companyType: filters.companyType,
          postedWithin: filters.postedWithin,
        },
        q: debouncedQ || undefined,
      });
      const res = await fetch(url, { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setJobs([]);
        setJobsError(data?.error || "Failed to load jobs");
        return;
      }
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch {
      setJobs([]);
      setJobsError("Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, [filters, debouncedQ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const fetchAppliedJobs = useCallback(async () => {
    setAppliedLoading(true);
    try {
      const res = await fetch("/api/job-applications", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setAppliedJobs([]);
        return;
      }
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      setAppliedJobs(list);
      setAppliedIds(new Set(list.map((j) => j.id)));
    } catch {
      setAppliedJobs([]);
    } finally {
      setAppliedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppliedJobs();
  }, [fetchAppliedJobs]);

  const fetchSavedJobs = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/job-saves", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setSavedJobs([]);
        return;
      }
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      setSavedJobs(list);
      setSavedIds(new Set(list.map((j) => j.id)));
    } catch {
      setSavedJobs([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleJobSave = useCallback(async (job, shouldSave) => {
    if (job?.id == null) return;
    const method = shouldSave ? "POST" : "DELETE";
    try {
      const res = await fetch("/api/job-saves", {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!res.ok) return;
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (shouldSave) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
      setSavedJobs((prev) => {
        if (shouldSave) {
          if (prev.some((j) => j.id === job.id)) return prev;
          return [{ ...job, hasSaved: true, savedAt: new Date().toISOString() }, ...prev];
        }
        return prev.filter((j) => j.id !== job.id);
      });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, hasSaved: shouldSave } : j))
      );
      setAppliedJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, hasSaved: shouldSave } : j))
      );
      setSelectedJob((prev) =>
        prev?.id === job.id ? { ...prev, hasSaved: shouldSave } : prev
      );
      if (selectedJobRef.current?.id === job.id) {
        selectedJobRef.current = {
          ...selectedJobRef.current,
          hasSaved: shouldSave,
        };
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectJob = useCallback((job) => {
    if (!job) return;
    selectedJobRef.current = job;
    setSelectedJob(job);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    selectedJobRef.current = null;
    setSelectedJob(null);
  }, []);

  const handleJobApplied = useCallback((job) => {
    if (job?.id == null) return;
    setAppliedIds((prev) => new Set(prev).add(job.id));
    setAppliedJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev;
      return [{ ...job, hasApplied: true, appliedAt: new Date().toISOString() }, ...prev];
    });
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, hasApplied: true } : j))
    );
    if (selectedJobRef.current?.id === job.id) {
      const next = { ...selectedJobRef.current, hasApplied: true };
      selectedJobRef.current = next;
      setSelectedJob(next);
    } else {
      setActiveTab("applied");
    }
  }, []);

  const { startApply, modal: confirmAppliedModal } = useConfirmApplied({
    onApplied: handleJobApplied,
  });

  useEffect(() => {
    if (!showProfileDropdown) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  const filteredJobs = useMemo(() => {
    if (!filters.radiusKm) return jobs;
    const homeLat = user?.homeLatitude;
    const homeLon = user?.homeLongitude;
    if (
      homeLat == null ||
      homeLon == null ||
      !Number.isFinite(Number(homeLat)) ||
      !Number.isFinite(Number(homeLon))
    ) {
      return jobs;
    }
    return filterByRadius(
      jobs.map((j) => ({
        ...j,
        latitude: j.company?.latitude ?? j.company?.lat,
        longitude: j.company?.longitude ?? j.company?.lon,
      })),
      Number(homeLat),
      Number(homeLon),
      filters.radiusKm
    );
  }, [jobs, filters.radiusKm, user?.homeLatitude, user?.homeLongitude]);

  const similarJobs = useMemo(() => {
    if (!selectedJob) return [];
    const others = filteredJobs.filter((j) => j.id !== selectedJob.id);
    const sameCategoryOrCompany = others.filter(
      (j) =>
        (selectedJob.category && j.category === selectedJob.category) ||
        (selectedJob.company?.id != null &&
          j.company?.id === selectedJob.company.id)
    );
    const pool =
      sameCategoryOrCompany.length > 0 ? sameCategoryOrCompany : others;
    return pool.slice(0, 10);
  }, [selectedJob, filteredJobs]);

  const hasHomeLocation =
    user?.homeLatitude != null &&
    user?.homeLongitude != null &&
    Number.isFinite(Number(user.homeLatitude)) &&
    Number.isFinite(Number(user.homeLongitude));

  const tabCounts = {
    recommended: 0,
    all: filteredJobs.length,
    saved: savedJobs.length,
    applied: appliedJobs.length,
  };

  const handleClearAll = () => {
    setFilters({ ...EMPTY_FILTERS });
    setDraftFilters({ ...EMPTY_FILTERS });
    setRoleOptions([]);
    setActiveTab("all");
  };

  const handleApplySidebarFilters = () => {
    setFilters((prev) => ({
      ...EMPTY_FILTERS,
      workMode: prev.workMode,
      radiusKm: prev.radiusKm,
      employmentType: draftFilters.employmentType || null,
      industryType: draftFilters.industryType || null,
      role: draftFilters.role || null,
      salaryBand: draftFilters.salaryBand || null,
      experience: draftFilters.experience || null,
      companyType: draftFilters.companyType || null,
      postedWithin: draftFilters.postedWithin || null,
    }));
    setActiveTab("all");
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* ignore */
    }
    window.location.href = "/onboarding";
  };

  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl
    : user?.avatarId
      ? getAvatarUrlById(user.avatarId)
      : null;

  const emptyCopy = {
    recommended: "No recommended jobs yet",
    saved: "No saved jobs yet",
    applied: "No applied jobs yet",
  };

  return (
    <div
      className="flex h-full w-full min-h-0 bg-white overflow-hidden"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <section className="flex flex-1 min-w-0 min-h-0 flex-col relative z-30">
        {selectedJob ? (
          <JobDetailPanel
            job={selectedJob}
            hasSaved={savedIds.has(selectedJob.id) || selectedJob.hasSaved}
            hasApplied={appliedIds.has(selectedJob.id) || selectedJob.hasApplied}
            onBack={handleBackFromDetail}
            onSave={handleJobSave}
            onApply={(j) => startApply(j, { openUrl: true })}
          />
        ) : (
          <>
        <div className="shrink-0 relative z-40 px-[200px] pt-[32px] pb-3 space-y-4 overflow-visible">
          <div className="text-center pb-[16px]">
            <h1 className="text-xl md:text-2xl font-semibold text-brand-text-strong">
              {userLoading ? "Welcome…" : `Welcome, ${displayName}`}
            </h1>
            <p className="text-sm text-brand-text-weak mt-0.5">
              Find jobs near you that match your interests
            </p>
          </div>

          <div className="relative z-30 w-full bg-brand-bg-white rounded-xl border border-brand-stroke-border shadow-sm px-3 py-1.5 md:px-4 md:py-2">
            <div className="flex flex-nowrap items-center gap-2 w-full min-w-0 overflow-visible">
              {user?.accountType !== "Company" && (
                <div className="flex rounded-full border border-brand-stroke-border overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push("/jobs-near-you")}
                    className="flex items-center gap-1.5 px-3 py-2 border-0 bg-transparent text-brand-text-weak hover:bg-brand-bg-fill transition-colors !rounded-l-md !rounded-r-none"
                    title="Gigs"
                  >
                    <User size={18} className="shrink-0" />
                    <span className="text-sm font-medium">Gigs</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 border-0 bg-brand/15 text-brand transition-colors !rounded-r-md !rounded-l-none"
                    title="Jobs"
                    aria-current="page"
                  >
                    <Briefcase size={18} className="shrink-0" />
                    <span className="text-sm font-medium">Jobs</span>
                  </button>
                </div>
              )}
              <div className="relative flex-1 min-w-0">
                <MagnifyingGlass
                  size={20}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-stroke-strong pointer-events-none"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setActiveTab("all");
                  }}
                  placeholder="Jobs near you"
                  className="w-full rounded-xl border-0 bg-transparent py-2 pl-9 pr-3 text-sm font-semibold text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:ring-0"
                  aria-label="Search jobs"
                  style={{ fontFamily: "Open Sans" }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 overflow-visible">
                <JobsFilterBar
                  searchModeForUI="company"
                  accountTypeForUI={user?.accountType || "Individual"}
                  userAccountType={user?.accountType || null}
                  gigs={[]}
                  selectedGigType={null}
                  onSelectGigType={() => {}}
                  showGigFilterDropdown={false}
                  setShowGigFilterDropdown={() => {}}
                  gigFilterButtonRef={{ current: null }}
                  gigFilterDropdownRef={{ current: null }}
                  selectedGigSalaryBand={null}
                  onSelectGigSalaryBand={() => {}}
                  showGigSalaryDropdown={false}
                  setShowGigSalaryDropdown={() => {}}
                  gigSalaryButtonRef={{ current: null }}
                  gigSalaryDropdownRef={{ current: null }}
                  selectedRadiusKm={filters.radiusKm}
                  onSelectRadiusKm={(km) => {
                    handleFiltersChange({ ...filters, radiusKm: km });
                  }}
                  showRadiusDropdown={showRadiusDropdown}
                  setShowRadiusDropdown={setShowRadiusDropdown}
                  radiusButtonRef={radiusButtonRef}
                  radiusDropdownRef={radiusDropdownRef}
                  selectedWorkMode={filters.workMode}
                  onSelectWorkMode={(mode) => {
                    handleFiltersChange({ ...filters, workMode: mode });
                  }}
                  showWorkModeDropdown={showWorkModeDropdown}
                  setShowWorkModeDropdown={setShowWorkModeDropdown}
                  workModeButtonRef={workModeButtonRef}
                  workModeDropdownRef={workModeDropdownRef}
                  onOpenMoreFilters={() => {}}
                  moreFiltersActive={moreFiltersActive}
                  candidateYearsOptions={[]}
                  selectedYearsExperience={null}
                  onSelectYearsExperience={() => {}}
                  showYearsFilterDropdown={false}
                  setShowYearsFilterDropdown={() => {}}
                  yearsFilterButtonRef={{ current: null }}
                  yearsFilterDropdownRef={{ current: null }}
                  candidateToolStackOptions={[]}
                  selectedToolStack={null}
                  onSelectToolStack={() => {}}
                  showToolStackFilterDropdown={false}
                  setShowToolStackFilterDropdown={() => {}}
                  toolStackFilterButtonRef={{ current: null }}
                  toolStackFilterDropdownRef={{ current: null }}
                  closeOtherDropdowns={closeOtherDropdowns}
                  hideMoreFilters
                />
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pt-[24px]" role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-brand text-brand"
                      : "border-transparent text-brand-text-weak hover:text-brand-text-strong"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      isActive ? "text-brand" : "text-brand-text-placeholder"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-b border-brand-stroke-weak" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[200px]">
          {activeTab === "applied" ? (
            appliedLoading ? (
              <ul className="divide-y divide-brand-stroke-weak">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="py-3.5">
                    <div className="h-4 w-2/3 rounded bg-brand-bg-fill animate-pulse" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-brand-bg-fill animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : appliedJobs.length === 0 ? (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <p className="text-sm text-brand-text-weak">{emptyCopy.applied}</p>
              </div>
            ) : (
              <ul className="w-full">
                {appliedJobs.map((job) => (
                  <JobListRow
                    key={job.id}
                    job={job}
                    company={job.company}
                    hasApplied
                    hasSaved={savedIds.has(job.id) || job.hasSaved}
                    onSave={handleJobSave}
                    onSelect={handleSelectJob}
                  />
                ))}
              </ul>
            )
          ) : activeTab === "saved" ? (
            savedLoading ? (
              <ul className="divide-y divide-brand-stroke-weak">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="py-3.5">
                    <div className="h-4 w-2/3 rounded bg-brand-bg-fill animate-pulse" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-brand-bg-fill animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : savedJobs.length === 0 ? (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <p className="text-sm text-brand-text-weak">{emptyCopy.saved}</p>
              </div>
            ) : (
              <ul className="w-full">
                {savedJobs.map((job) => (
                  <JobListRow
                    key={job.id}
                    job={job}
                    company={job.company}
                    hasSaved
                    hasApplied={appliedIds.has(job.id) || job.hasApplied}
                    onSave={handleJobSave}
                    onMarkApplied={(j) => startApply(j, { openUrl: false })}
                    onSelect={handleSelectJob}
                  />
                ))}
              </ul>
            )
          ) : activeTab !== "all" ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <p className="text-sm text-brand-text-weak">{emptyCopy[activeTab]}</p>
            </div>
          ) : jobsLoading ? (
            <ul className="divide-y divide-brand-stroke-weak">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="py-3.5">
                  <div className="h-4 w-2/3 rounded bg-brand-bg-fill animate-pulse" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-brand-bg-fill animate-pulse" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-brand-bg-fill animate-pulse" />
                </li>
              ))}
            </ul>
          ) : jobsError ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2">
              <p className="text-sm text-brand-text-weak">{jobsError}</p>
              <button
                type="button"
                onClick={fetchJobs}
                className="text-sm text-brand underline"
              >
                Try again
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <p className="text-sm text-brand-text-weak">
                No jobs match your filters
              </p>
            </div>
          ) : (
            <ul className="w-full">
              {filteredJobs.map((job) => (
                <JobListRow
                  key={job.id}
                  job={job}
                  company={job.company}
                  hasApplied={appliedIds.has(job.id) || job.hasApplied}
                  hasSaved={savedIds.has(job.id) || job.hasSaved}
                  onMarkApplied={(j) => startApply(j, { openUrl: false })}
                  onSave={handleJobSave}
                  onSelect={handleSelectJob}
                />
              ))}
            </ul>
          )}
        </div>
          </>
        )}
      </section>

      <aside className="flex w-[336px] md:w-[396px] shrink-0 flex-col h-full min-h-0 border-l border-r border-brand-stroke-weak bg-brand-bg-white mr-[56px]">
        {/* Notif next to round profile (right-aligned), smaller, no border */}
        <div className="shrink-0 flex items-center justify-end gap-1.5 px-4 py-3 border-b border-brand-stroke-weak">
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="relative h-9 w-9 flex items-center justify-center rounded-full bg-transparent hover:bg-brand-bg-fill transition-colors"
            aria-label="Notifications"
          >
            <Image
              src="/icons/sidebar/notifications.png"
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain"
              unoptimized
            />
            {notificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 bg-brand text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5"
                style={{ fontSize: "9px" }}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown((v) => !v)}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-transparent hover:bg-brand-bg-fill transition-colors overflow-hidden"
              aria-label="Profile menu"
              aria-expanded={showProfileDropdown}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <User size={22} className="text-brand-stroke-strong shrink-0" />
              )}
            </button>

            {showProfileDropdown && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 z-[100] min-w-[14rem] rounded-lg border border-brand-stroke-weak bg-brand-bg-white shadow-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 text-sm text-brand-text-strong break-all border-b border-brand-stroke-weak"
                  title={user?.email || "Signed in"}
                >
                  <User size={18} className="shrink-0 text-brand-stroke-strong" />
                  <span className="truncate">{user?.email || "Signed in"}</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onOpenSettings?.();
                  }}
                >
                  <Gear size={18} className="text-brand-stroke-strong shrink-0" />
                  <span>Settings</span>
                </button>
                <div className="border-t border-brand-stroke-weak" />
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <SignOut size={18} className="text-brand-stroke-strong shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedJob ? (
          <>
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-brand-stroke-weak">
              <h2 className="text-sm font-semibold text-brand-text-strong">
                Similar jobs
              </h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {similarJobs.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center px-4">
                  <p className="text-sm text-brand-text-weak text-center">
                    No similar jobs right now
                  </p>
                </div>
              ) : (
                <ul className="w-full">
                  {similarJobs.map((job) => (
                    <JobListRow
                      key={job.id}
                      job={job}
                      company={job.company}
                      hasApplied={appliedIds.has(job.id) || job.hasApplied}
                      hasSaved={savedIds.has(job.id) || job.hasSaved}
                      onSelect={handleSelectJob}
                      onSave={handleJobSave}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Filters */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-brand-stroke-weak">
              <h2 className="text-sm font-semibold text-brand-text-strong">Filters</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              {filters.radiusKm && !hasHomeLocation && (
                <p className="text-xs text-brand-text-weak mb-3">
                  Set your home location in Settings to filter by radius.
                </p>
              )}
              <JobsFiltersPanel
                filters={draftFilters}
                onChange={handleDraftFiltersChange}
                industryCategories={industryCategories}
                roleOptions={roleOptions}
                onIndustryChange={(cat) => {
                  if (!cat) setRoleOptions([]);
                }}
                showWorkMode={false}
                showRadius={false}
                layout="compact"
              />
            </div>
            <div className="shrink-0 flex gap-2 border-t border-brand-stroke-weak px-4 py-4">
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 rounded-md border border-brand-stroke-weak text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={handleApplySidebarFilters}
                className="flex-1 px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </>
        )}
      </aside>
      {confirmAppliedModal}
    </div>
  );
}
