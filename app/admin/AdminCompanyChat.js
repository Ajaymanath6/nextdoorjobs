"use client";

import { useState, useRef, useEffect } from "react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";
import UrlInput from "../components/Onboarding/UrlInput";
import FundingSeriesBadges from "../components/Onboarding/FundingSeriesBadges";
import PincodeDropdown from "../components/Onboarding/PincodeDropdown";
import ExperienceRangeSelect from "../components/Onboarding/ExperienceRangeSelect";
import SalaryRangeBadges from "../components/Onboarding/SalaryRangeBadges";
import RemoteTypeSelector from "../components/Onboarding/RemoteTypeSelector";
import SeniorityLevelSelector from "../components/Onboarding/SeniorityLevelSelector";
import { JOB_CATEGORIES } from "../../lib/constants/jobCategories";
import { WatsonHealthRotate_360, TrashCan, Location, Edit, Renew, DocumentBlank } from "@carbon/icons-react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import EditJobModal from "../components/EditJobModal";

function ExistingCompanyPicker({ companies, onSelect, onDelete }) {
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const normalizedQuery = query.toLowerCase().trim();
  const filtered =
    !normalizedQuery
      ? companies
      : companies.filter((c) => {
          const name = (c.name || "").toLowerCase();
          const description = (c.description || "").toLowerCase();
          const state = (c.state || "").toLowerCase();
          const district = (c.district || "").toLowerCase();
          return (
            name.includes(normalizedQuery) ||
            description.includes(normalizedQuery) ||
            state.includes(normalizedQuery) ||
            district.includes(normalizedQuery)
          );
        });

  const handleDeleteClick = async (e, companyId, companyName) => {
    e.stopPropagation();
    if (confirmDeleteId === companyId) {
      setDeletingId(companyId);
      try {
        const res = await fetch(`/api/admin/companies/${companyId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          if (onDelete) onDelete(companyId);
          setConfirmDeleteId(null);
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to delete company");
        }
      } catch (err) {
        alert("Network error. Please try again.");
      } finally {
        setDeletingId(null);
      }
    } else {
      setConfirmDeleteId(companyId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div ref={containerRef} className="w-full border border-brand-stroke-weak rounded-lg bg-white/95 shadow-sm px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-text-strong">
          Or pick an existing company
        </p>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsListOpen(true)}
        onClick={() => setIsListOpen(true)}
        placeholder="Search companies by name or location..."
        className="w-full px-3 py-2 text-sm border border-brand-stroke-weak rounded-md bg-brand-bg-white placeholder:text-brand-text-placeholder text-brand-text-strong focus:outline-none focus:border-brand-text-strong"
      />
      {isListOpen && (
      <div className="max-h-60 overflow-y-auto rounded-md border border-brand-stroke-subtle bg-brand-bg-white/80">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-xs text-brand-text-weak">
            No existing companies match. Type a new name above to create a new company.
          </div>
        ) : (
          filtered.map((company) => {
            const locationParts = [
              company.district || null,
              company.state || null,
              company.pincode || null,
            ].filter(Boolean);
            const locationLabel = locationParts.join(", ");
            const isDeleting = deletingId === company.id;
            const isConfirming = confirmDeleteId === company.id;
            return (
              <div
                key={company.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-bg-fill transition-colors flex items-start gap-2 group"
              >
                <button
                  type="button"
                  onClick={() => onSelect(company)}
                  className="flex-1 flex flex-col gap-0.5 min-w-0"
                >
                  <span className="font-medium text-brand-text-strong truncate">
                    {company.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, company.id, company.name)}
                  disabled={isDeleting}
                  className={`shrink-0 p-1.5 rounded transition-colors ${
                    isConfirming
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "text-brand-text-weak hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                  } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={isConfirming ? "Click again to confirm delete" : "Delete company"}
                >
                  <TrashCan size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}

function formatPostedAt(createdAt) {
  if (!createdAt) return "";
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const jobDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (jobDayStart.getTime() === todayStart.getTime()) return "Posted today";
  if (jobDayStart.getTime() === yesterdayStart.getTime()) return "Posted yesterday";
  const weekday = date.toLocaleDateString("en-IN", { weekday: "long" });
  return `Posted ${weekday}`;
}

function JobListingPanelJobs({
  jobs,
  emptyMessage,
  onSeeOnMap,
  onExtend,
  extendingId,
  onEdit,
  onDelete,
}) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <DocumentBlank size={48} className="text-brand-text-weak mb-3" aria-hidden />
        <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }
  const groups = [];
  const byKey = new Map();
  for (const job of jobs) {
    const key = job.company?.id ?? job.companyName ?? "unknown";
    if (!byKey.has(key)) {
      const companyName = job.company?.name || job.companyName || "Company";
      const company = job.company;
      byKey.set(key, { companyName, company, jobs: [] });
      groups.push(byKey.get(key));
    }
    byKey.get(key).jobs.push(job);
  }
  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div
          key={group.company?.id ?? group.companyName ?? "unknown"}
          className={groupIndex === 0 ? "" : "pt-4 border-t border-brand-stroke-weak"}
        >
          <div className="flex items-center gap-2 mb-2">
            {group.company?.logoPath ? (
              <img
                src={group.company.logoPath}
                alt=""
                className="w-6 h-6 rounded object-contain bg-brand-bg-fill"
              />
            ) : null}
            <h3 className="text-sm font-semibold text-brand-text-strong" style={{ fontFamily: "Open Sans, sans-serif" }}>
              {group.companyName}
            </h3>
          </div>
          <ul className="space-y-2">
            {group.jobs.map((job) => {
              const companyName = job.companyName || job.company?.name || "";
              const logoUrl = job.company?.logoPath || (job.company?.websiteUrl ? (() => {
                try {
                  const h = new URL(job.company.websiteUrl).hostname;
                  return h ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=128` : null;
                } catch (_) { return null; }
              })() : null);
              return (
                <li
                  key={job.id}
                  className="flex items-center gap-2 py-2 border-b border-brand-stroke-weak last:border-b-0 last:pb-0 first:pt-0"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-brand-text-strong truncate"
                      style={{ fontFamily: "Open Sans, sans-serif" }}
                    >
                      {job.title}
                    </p>
                    <p
                      className="text-xs text-brand-text-weak mt-0.5 break-words"
                      style={{ fontFamily: "Open Sans, sans-serif" }}
                    >
                      {job.jobDescription}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {formatPostedAt(job.createdAt) ? (
                      <span className="text-xs text-brand-text-weak whitespace-nowrap" style={{ fontFamily: "Open Sans, sans-serif", marginLeft: 16 }}>
                        {formatPostedAt(job.createdAt)}
                      </span>
                    ) : null}
                    {job.company?.latitude != null && job.company?.longitude != null ? (
                      <button
                        type="button"
                        onClick={() => onSeeOnMap(job)}
                        className="p-1.5 rounded-md text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-stroke-strong transition-colors"
                        title="See on map"
                        aria-label="See on map"
                      >
                        <Location size={18} />
                      </button>
                    ) : null}
                    {onExtend ? (
                      <button
                        type="button"
                        onClick={() => onExtend(job.id)}
                        disabled={extendingId === job.id}
                        className="p-1.5 rounded-md text-brand-text-weak hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50 relative"
                        title="Extend posting by 2 weeks"
                        aria-label="Extend job"
                      >
                        {extendingId === job.id ? (
                          <div className="w-[18px] h-[18px] border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Renew size={18} />
                        )}
                      </button>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(job)}
                        className="p-1.5 rounded-md text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-stroke-strong transition-colors"
                        title="Edit job"
                        aria-label="Edit job"
                      >
                        <Edit size={18} />
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(job)}
                        className="p-1.5 rounded-md text-brand-text-weak hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete job"
                        aria-label="Delete job"
                      >
                        <TrashCan size={18} />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

const COMPANY_FIELDS = {
  NAME: "company_name",
  STATE: "company_state",
  DISTRICT: "company_district",
  WEBSITE: "company_website",
  FUNDING: "company_funding",
  DESCRIPTION: "company_description",
  LOCATION: "company_location",
  PINCODE: "company_pincode",
};

const JOB_FIELDS = {
  TITLE: "job_title",
  DESCRIPTION: "job_description",
  CATEGORY: "job_category",
  YEARS: "job_years",
  SALARY: "job_salary",
  REMOTE_TYPE: "job_remote_type",
  SENIORITY: "job_seniority",
  APPLICATION_LINK: "job_application_link",
};

const INITIAL_AI_MESSAGE =
  "Let's add a company and post a job. What's the company name?";

function extractValue(message) {
  const trimmed = (message || "").trim();
  return trimmed.replace(/^["']|["']$/g, "");
}

export default function AdminCompanyChat() {
  const [chatMessages, setChatMessages] = useState([
    { type: "ai", text: INITIAL_AI_MESSAGE },
  ]);
  const [inlineComponent, setInlineComponent] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState({});
  const [jobData, setJobData] = useState({});
  const [currentField, setCurrentField] = useState(COMPANY_FIELDS.NAME);
  const [collectingCompany, setCollectingCompany] = useState(true);
  const [createdCompany, setCreatedCompany] = useState(null);
  const [lastJobCoords, setLastJobCoords] = useState(null);
  const [existingJobCompanies, setExistingJobCompanies] = useState([]);
  const [existingJobCompaniesLoaded, setExistingJobCompaniesLoaded] =
    useState(false);
  const scrollToInlineRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [jobListingOpen, setJobListingOpen] = useState(false);
  const [jobListingTab, setJobListingTab] = useState("recent");
  const [jobListingRecentJobs, setJobListingRecentJobs] = useState([]);
  const [jobListingAllJobs, setJobListingAllJobs] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [adminJobsCache, setAdminJobsCache] = useState([]);
  const [jobListingDeleteConfirmOpen, setJobListingDeleteConfirmOpen] = useState(false);
  const [jobListingToDelete, setJobListingToDelete] = useState(null);
  const [jobListingDeletingId, setJobListingDeletingId] = useState(null);
  const [jobListingEditModalOpen, setJobListingEditModalOpen] = useState(false);
  const [jobListingToEdit, setJobListingToEdit] = useState(null);
  const [jobListingExtendingId, setJobListingExtendingId] = useState(null);
  const jobDataRef = useRef({});
  const createdCompanyRef = useRef(null);
  useEffect(() => {
    jobDataRef.current = jobData;
  }, [jobData]);
  useEffect(() => {
    createdCompanyRef.current = createdCompany;
  }, [createdCompany]);

  useEffect(() => {
    // Fetch admin jobs once to derive companies that already have at least one active job
    const fetchExistingCompanies = async () => {
      try {
        const res = await fetch("/api/admin/jobs", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        const byId = new Map();
        for (const job of jobs) {
          const c = job?.company;
          if (!c || !c.id) continue;
          if (!byId.has(c.id)) {
            byId.set(c.id, {
              id: c.id,
              name: c.name || "",
              description: c.description || "",
              websiteUrl: c.websiteUrl || "",
              latitude:
                c.latitude != null && Number.isFinite(Number(c.latitude))
                  ? Number(c.latitude)
                  : null,
              longitude:
                c.longitude != null && Number.isFinite(Number(c.longitude))
                  ? Number(c.longitude)
                  : null,
              state: c.state || "",
              district: c.district || "",
              pincode: c.pincode || "",
              logoPath: c.logoPath || "",
            });
          }
        }
        setExistingJobCompanies(Array.from(byId.values()));
      } catch (err) {
        console.error("Failed to fetch existing admin companies with jobs:", err);
      } finally {
        setExistingJobCompaniesLoaded(true);
      }
    };

    fetchExistingCompanies();
  }, []);

  const handleCompanyDeleted = (companyId) => {
    setExistingJobCompanies((prev) => prev.filter((c) => c.id !== companyId));
  };

  const handleExistingCompanySelected = async (company) => {
    // Synthetic user message so history is clear
    setChatMessages((prev) => [
      ...prev,
      { type: "user", text: `Use existing company: ${company?.name || ""}` },
    ]);

    // Prefill local company data for any later use (map zoom, etc.)
    setCompanyData({
      name: company.name || "",
      description: company.description || "",
      websiteUrl: company.websiteUrl || "",
      state: company.state || "",
      district: company.district || "",
      pincode: company.pincode || "",
      latitude: company.latitude ?? null,
      longitude: company.longitude ?? null,
      logoPath: company.logoPath || "",
    });

    // Treat this as the selected company for subsequent job submissions
    const normalizedCompany = {
      id: company.id,
      name: company.name || "",
      description: company.description || null,
      websiteUrl: company.websiteUrl || null,
      state: company.state || null,
      district: company.district || null,
      pincode: company.pincode || null,
      latitude: company.latitude ?? null,
      longitude: company.longitude ?? null,
      logoPath: company.logoPath || null,
    };
    setCreatedCompany(normalizedCompany);

    setCollectingCompany(false);
    setCurrentField(JOB_FIELDS.TITLE);
    setInlineComponent(null);

    const locationParts = [
      normalizedCompany.district || null,
      normalizedCompany.state || null,
      normalizedCompany.pincode || null,
    ].filter(Boolean);
    const locationLabel = locationParts.join(", ");

    const descriptionText = normalizedCompany.description
      ? `Description: ${normalizedCompany.description}`
      : "No description saved yet.";

    const prefix = locationLabel
      ? `Using existing company "${normalizedCompany.name}" at ${locationLabel}. `
      : `Using existing company "${normalizedCompany.name}". `;

    await addAIMessage(
      `${prefix}${descriptionText} Now let's add a new job. What's the job title?`
    );
  };

  const handleShowRecentJobs = async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch("/api/admin/jobs?filter=recent", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      const jobsRaw = Array.isArray(data.jobs) ? data.jobs : [];
      const jobs = jobsRaw.filter((job) => job && job.isActive !== false);
      setJobListingRecentJobs(jobs);
    } catch (err) {
      console.error("Failed to load recent admin jobs:", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleShowAllJobs = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/admin/jobs?filter=all", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      const jobsRaw = Array.isArray(data.jobs) ? data.jobs : [];
      const jobs = jobsRaw.filter((job) => job && job.isActive !== false);
      setJobListingAllJobs(jobs);
    } catch (err) {
      console.error("Failed to load all admin jobs:", err);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleOpenJobListing = () => {
    setJobListingOpen((prev) => {
      if (!prev) {
        setJobListingTab("recent");
        handleShowRecentJobs();
      }
      return !prev;
    });
  };

  const handleJobListingTabChange = (tab) => {
    setJobListingTab(tab);
    if (tab === "all" && jobListingAllJobs.length === 0 && !loadingAll) {
      handleShowAllJobs();
    }
  };

  const handleJobListingSeeOnMap = async (job) => {
    const company = job.company;
    const lat = company?.latitude != null ? Number(company.latitude) : null;
    const lng = company?.longitude != null ? Number(company.longitude) : null;
    if (lat == null || lng == null) return;
    const payload = {
      lat,
      lng,
      companyName: company?.name || job.title || "Job posting",
      logoUrl: company?.logoPath || null,
    };
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
    if (typeof localStorage !== "undefined") localStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
    try {
      await fetch("/api/admin/set-view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "individual" }),
      });
    } catch (_) {}
    if (typeof window !== "undefined") window.open("/", "_blank");
  };

  const handleJobListingExtend = async (jobId) => {
    setJobListingExtendingId(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/extend`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const updated = data.jobPosition || data.job;
        if (updated) {
          handleAdminJobEdited(updated);
          setJobListingRecentJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updated } : j)));
          setJobListingAllJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updated } : j)));
        }
      }
    } catch (err) {
      console.error("Failed to extend job:", err);
    } finally {
      setJobListingExtendingId(null);
    }
  };

  const handleJobListingDelete = async (jobId) => {
    setJobListingDeletingId(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        setJobListingDeleteConfirmOpen(false);
        setJobListingToDelete(null);
        handleAdminJobDeleted(jobId);
        setJobListingRecentJobs((prev) => prev.filter((j) => j.id !== jobId));
        setJobListingAllJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
    } finally {
      setJobListingDeletingId(null);
    }
  };

  const handleJobListingEdited = (updatedJob) => {
    if (!updatedJob?.id) return;
    handleAdminJobEdited(updatedJob);
    setJobListingRecentJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? { ...j, ...updatedJob } : j)));
    setJobListingAllJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? { ...j, ...updatedJob } : j)));
  };

  const handleAdminJobDeleted = (jobId) => {
    setAdminJobsCache((prev) => prev.filter((job) => job.id !== jobId));
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        const msg = next[i];
        if (msg.type === "jobList") {
          next[i] = {
            ...msg,
            jobs: (msg.jobs || []).filter((job) => job.id !== jobId),
          };
          break;
        }
      }
      return next;
    });
  };

  const handleAdminJobEdited = (updatedJob) => {
    if (!updatedJob || !updatedJob.id) return;
    setAdminJobsCache((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? { ...job, ...updatedJob } : job))
    );
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        const msg = next[i];
        if (msg.type === "jobList") {
          next[i] = {
            ...msg,
            jobs: (msg.jobs || []).map((job) =>
              job.id === updatedJob.id ? { ...job, ...updatedJob } : job
            ),
          };
          break;
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== "undefined" &&
          (window.innerWidth < 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            ))
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // When starting from the very first question and admin already has jobs,
    // offer a dropdown to reuse an existing company instead of re-answering company questions.
    if (
      !existingJobCompaniesLoaded ||
      existingJobCompanies.length === 0 ||
      !collectingCompany ||
      currentField !== COMPANY_FIELDS.NAME
    ) {
      return;
    }
    setInlineComponent(
      <ExistingCompanyPicker
        companies={existingJobCompanies}
        onSelect={handleExistingCompanySelected}
        onDelete={handleCompanyDeleted}
      />
    );
  }, [
    existingJobCompanies,
    existingJobCompaniesLoaded,
    collectingCompany,
    currentField,
  ]);

  const addAIMessage = async (text) => {
    setIsTyping(true);
    setTypingText("");
    for (let i = 0; i < text.length; i++) {
      setTypingText(text.slice(0, i + 1));
      await new Promise((r) => setTimeout(r, 10));
    }
    setIsTyping(false);
    setChatMessages((prev) => [...prev, { type: "ai", text }]);
    setTypingText("");
  };

  const scrollToInline = () => {
    setTimeout(() => scrollToInlineRef.current?.(), 150);
  };

  const handleLocationReceived = async (lat, lon) => {
    const latitude = typeof lat === "number" ? lat : parseFloat(lat);
    const longitude = typeof lon === "number" ? lon : parseFloat(lon);
    let state = companyData?.state ?? null;
    let district = companyData?.district ?? null;
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        state = data.state ?? state;
        district = data.district ?? district;
      }
    } catch (_) {}
    setCompanyData((prev) => ({
      ...prev,
      latitude,
      longitude,
      ...(state && { state }),
      ...(district && { district }),
    }));
    await addAIMessage(
      `Location saved: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}${district && state ? ` • ${district}, ${state}` : ""}.`
    );

    let pincodes = [];
    if (district && state) {
      try {
        const pinRes = await fetch(
          `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
        );
        if (pinRes.ok) {
          const { pincodes: list } = await pinRes.json();
          pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
        }
      } catch (_) {}
    }
    if (pincodes.length > 0) {
      await addAIMessage("What's the pincode? (Choose one or skip)");
      setCurrentField(COMPANY_FIELDS.PINCODE);
      setInlineComponent(
        <PincodeDropdown
          pincodes={pincodes}
          onSelect={(pincode) => {
            setCompanyData((prev) => ({ ...prev, pincode }));
            setInlineComponent(null);
            handleCompanySubmit({ pincode });
          }}
          onSkip={() => {
            setInlineComponent(null);
            handleCompanySubmit({});
          }}
        />
      );
      scrollToInline();
    } else {
      await addAIMessage('What\'s the pincode? (Type pincode or "skip")');
      setCurrentField(COMPANY_FIELDS.PINCODE);
    }
  };

  const handleLocationSkipped = async () => {
    await addAIMessage('What\'s the pincode? (Type pincode or "skip")');
    setCurrentField(COMPANY_FIELDS.PINCODE);
  };

  const handleWebsiteSubmitted = async (url) => {
    const value = (url || "").trim();
    const isSkip = !value || value.toLowerCase() === "skip";
    let logoFetched = false;

    if (!isSkip) {
      const normalizedUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      setCompanyData((prev) => ({ ...prev, websiteUrl: normalizedUrl }));

      setIsLoading(true);
      try {
        const logoRes = await fetch(
          `/api/onboarding/fetch-logo?url=${encodeURIComponent(normalizedUrl)}`
        );
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          if (logoData.success && logoData.logoUrl) {
            logoFetched = true;
            setCompanyData((prev) => ({
              ...prev,
              websiteUrl: normalizedUrl,
              logoPath: logoData.logoUrl,
              logoUrl: logoData.logoUrl,
            }));
          }
        }
      } catch (e) {
        // Ignore logo fetch errors and continue
      }

      try {
        const locRes = await fetch(
          `/api/onboarding/company-from-url?url=${encodeURIComponent(normalizedUrl)}`
        );
        if (locRes.ok) {
          const data = await locRes.json();
          const hasAll =
            data.state &&
            data.district &&
            typeof data.latitude === "number" &&
            typeof data.longitude === "number";
          if (hasAll) {
            setCompanyData((prev) => ({
              ...prev,
              state: data.state,
              district: data.district,
              latitude: String(data.latitude),
              longitude: String(data.longitude),
              ...(data.pincode && { pincode: data.pincode }),
            }));
          }
        }
      } catch (e) {
        // Ignore failures, we still proceed
      }

      await addAIMessage(
        logoFetched
          ? `Website noted: ${value}. We found your company logo!`
          : `Website noted: ${value}.`
      );
    } else {
      await addAIMessage("Website skipped.");
    }

    await addAIMessage(
      "Add company location (coordinates), or skip to enter pincode only."
    );
    setCurrentField(COMPANY_FIELDS.LOCATION);
    setInlineComponent(
      <GetCoordinatesButton
        isMobile={isMobile}
        onCoordinatesReceived={(lat, lon) => {
          setInlineComponent(null);
          handleLocationReceived(lat, lon);
        }}
        onSkip={() => {
          setInlineComponent(null);
          handleLocationSkipped();
        }}
      />
    );
    scrollToInline();
    setIsLoading(false);
  };

  const handleCompanySubmit = async (overrides = {}) => {
    const c = { ...companyData, ...overrides };
    const name = (c.name || "").trim();
    const state = (c.state || "").trim();
    const district = (c.district || "").trim();
    if (!name || !state || !district) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Company name, state, and district are required. Please try again.",
        },
      ]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          state,
          district,
          description: c.description?.trim() || null,
          websiteUrl: c.websiteUrl?.trim() || null,
          fundingSeries: c.fundingSeries || null,
          logoPath: c.logoPath || c.logoUrl || null,
          latitude:
            c.latitude != null && Number.isFinite(Number(c.latitude))
              ? Number(c.latitude)
              : null,
          longitude:
            c.longitude != null && Number.isFinite(Number(c.longitude))
              ? Number(c.longitude)
              : null,
          pincode: c.pincode?.trim() || null,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.company) {
        setCreatedCompany({
          ...result.company,
          latitude: c.latitude != null ? Number(c.latitude) : null,
          longitude: c.longitude != null ? Number(c.longitude) : null,
        });
        setCollectingCompany(false);
        setCompanyData({});
        setCurrentField(JOB_FIELDS.TITLE);
        await addAIMessage(
          `Company "${result.company.name}" created. Now let's add the job. What's the job title?`
        );
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Couldn't create company. ${result.error || "Please try again."}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Company submit error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `Something went wrong. ${err?.message || "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSubmit = async () => {
    const j = jobDataRef.current;
    const company = createdCompanyRef.current;
    const title = (j.title || "").trim();
    const jobDescription = (j.jobDescription || "").trim();
    const category = j.category || "EngineeringSoftwareQA";
    if (!title || !jobDescription || !company?.id) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Job title and description are required. Please try again.",
        },
      ]);
      return;
    }
    setIsLoading(true);
    try {
      const yearsRequired =
        j.yearsRequired != null ? parseFloat(j.yearsRequired) : 0;
      const salaryMin =
        j.salaryMin != null && j.salaryMin !== ""
          ? parseInt(String(j.salaryMin), 10)
          : null;
      const salaryMax =
        j.salaryMax != null && j.salaryMax !== ""
          ? parseInt(String(j.salaryMax), 10)
          : null;

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          category,
          jobDescription,
          companyId: company.id,
          yearsRequired: Number.isNaN(yearsRequired) ? 0 : yearsRequired,
          salaryMin: Number.isNaN(salaryMin) ? null : salaryMin,
          salaryMax: Number.isNaN(salaryMax) ? null : salaryMax,
          remoteType: j.remoteType?.trim() || null,
          seniorityLevel: j.seniorityLevel?.trim() || null,
          applicationUrl: j.applicationUrl?.trim() || null,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.jobPosition) {
        const companyLat = company.latitude;
        const companyLon = company.longitude;
        const logoUrl =
          company.logoPath ||
          companyData?.logoPath ||
          companyData?.logoUrl ||
          null;
        if (
          companyLat != null &&
          companyLon != null &&
          (typeof sessionStorage !== "undefined" ||
            typeof localStorage !== "undefined")
        ) {
          const payload = {
            lat: companyLat,
            lng: companyLon,
            companyName: company.name || "Your posting",
            logoUrl: logoUrl || null,
          };
          setLastJobCoords({ lat: companyLat, lng: companyLon, logoUrl: logoUrl || null });
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
          }
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
          }
        }
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "🎉 Job posting created successfully!",
            isFinalMessage: true,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Couldn't create job. ${result.error || "Please try again."}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Job submit error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `Something went wrong. ${err?.message || "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationLinkSubmitted = async (url) => {
    setInlineComponent(null);
    if (url && url.toLowerCase() !== "skip") {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      setJobData((prev) => ({ ...prev, applicationUrl: normalized }));
    }
    await addAIMessage("Submitting job posting...");
    await handleJobSubmit();
  };

  const goToApplicationLinkStep = () => {
    addAIMessage(
      "Job application link? (URL where applicants can apply, or skip)"
    );
    setCurrentField(JOB_FIELDS.APPLICATION_LINK);
    setInlineComponent(
      <UrlInput
        onUrlSubmit={(url) => handleApplicationLinkSubmitted(url)}
        onSkip={() => handleApplicationLinkSubmitted("skip")}
        placeholder="Enter application URL or skip..."
      />
    );
    scrollToInline();
  };

  const handleViewOnMap = async () => {
    if (lastJobCoords && (typeof sessionStorage !== "undefined" || typeof localStorage !== "undefined")) {
      const payload = {
        lat: lastJobCoords.lat,
        lng: lastJobCoords.lng,
        companyName: createdCompany?.name || "Your posting",
        logoUrl: lastJobCoords.logoUrl || createdCompany?.logoPath || null,
      };
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
      }
    }
    try {
      await fetch("/api/admin/set-view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "individual" }),
      });
    } catch (err) {
      console.error("Failed to set admin view-as before opening map:", err);
    }
    if (typeof window !== "undefined") {
      window.open("/", "_blank");
    }
  };

  const handleStartNext = () => {
    setChatMessages([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
    setInlineComponent(null);
    setCompanyData({});
    setJobData({});
    setCurrentField(COMPANY_FIELDS.NAME);
    setCollectingCompany(true);
    setCreatedCompany(null);
    setLastJobCoords(null);
  };

  const handleResetChat = () => {
    setChatMessages([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
    setInlineComponent(null);
    setTypingText("");
    setIsTyping(false);
    setIsLoading(false);
    setCompanyData({});
    setJobData({});
    setCurrentField(COMPANY_FIELDS.NAME);
    setCollectingCompany(true);
    setCreatedCompany(null);
    setLastJobCoords(null);
  };

  const handleChatMessage = async (message) => {
    const value = extractValue(message);
    setChatMessages((prev) => [...prev, { type: "user", text: message }]);
    setIsLoading(true);

    setTimeout(async () => {
      if (collectingCompany) {
        switch (currentField) {
          case COMPANY_FIELDS.NAME:
            setCompanyData((prev) => ({ ...prev, name: value }));
            await addAIMessage(
              `Got it! Company: "${value}". What does your company do? (short description or type skip)`
            );
            setCurrentField(COMPANY_FIELDS.DESCRIPTION);
            break;

          case COMPANY_FIELDS.DESCRIPTION:
            if (value.toLowerCase() !== "skip" && value) {
              setCompanyData((prev) => ({ ...prev, description: value }));
            }
            await addAIMessage(
              "Do you have a company website URL? (Enter URL or skip)"
            );
            setCurrentField(COMPANY_FIELDS.WEBSITE);
            setInlineComponent(
              <UrlInput
                onUrlSubmit={(url) => {
                  if (url.toLowerCase() !== "skip") {
                    setCompanyData((prev) => ({ ...prev, websiteUrl: url }));
                  }
                  setInlineComponent(null);
                  handleWebsiteSubmitted(url);
                }}
                onSkip={() => {
                  setInlineComponent(null);
                  handleWebsiteSubmitted("skip");
                }}
                placeholder="Enter website URL or click skip..."
              />
            );
            scrollToInline();
            break;

          case COMPANY_FIELDS.PINCODE:
            if (value.toLowerCase() !== "skip" && value) {
              setCompanyData((prev) => ({ ...prev, pincode: value }));
            }
            await handleCompanySubmit();
            break;

          default:
            break;
        }
      } else {
        switch (currentField) {
          case JOB_FIELDS.TITLE:
            setJobData((prev) => ({ ...prev, title: value }));
            await addAIMessage(
              `Job title: ${value}. Please provide a detailed job description.`
            );
            setCurrentField(JOB_FIELDS.DESCRIPTION);
            break;

          case JOB_FIELDS.DESCRIPTION:
            setJobData((prev) => ({ ...prev, jobDescription: value }));
            await addAIMessage("Select job category:");
            setCurrentField(JOB_FIELDS.CATEGORY);
            setInlineComponent(
              <div className="w-full flex flex-wrap gap-2 p-4 border border-brand-stroke-weak rounded-lg bg-white/95">
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setJobData((prev) => ({ ...prev, category: cat.value }));
                      setChatMessages((prev) => [
                        ...prev,
                        { type: "user", text: cat.label },
                      ]);
                      setInlineComponent(null);
                      addAIMessage(`Category: ${cat.label}. How many years of experience required?`).then(
                        () => {
                          setCurrentField(JOB_FIELDS.YEARS);
                          setInlineComponent(
                            <ExperienceRangeSelect
                              onSelect={(years) => {
                                setJobData((prev) => ({
                                  ...prev,
                                  yearsRequired: years,
                                }));
                                setChatMessages((prev) => [
                                  ...prev,
                                  { type: "user", text: `${years} years` },
                                ]);
                                setInlineComponent(null);
                                addAIMessage("What's the salary range?").then(
                                  () => {
                                    setCurrentField(JOB_FIELDS.SALARY);
                                    setInlineComponent(
                                      <SalaryRangeBadges
                                        onSelect={(min, max) => {
                                          setJobData((prev) => ({
                                            ...prev,
                                            salaryMin: min,
                                            salaryMax: max,
                                          }));
                                          setInlineComponent(null);
                                          addAIMessage(
                                            "Remote type? (Remote, Hybrid, On-site — or skip)"
                                          ).then(() => {
                                            setCurrentField(
                                              JOB_FIELDS.REMOTE_TYPE
                                            );
                                            setInlineComponent(
                                              <RemoteTypeSelector
                                                selectedValue={
                                                  jobData?.remoteType || null
                                                }
                                                onSelect={(type) => {
                                                  setJobData((prev) => ({
                                                    ...prev,
                                                    remoteType: type,
                                                  }));
                                                  setChatMessages((prev) => [
                                                    ...prev,
                                                    {
                                                      type: "user",
                                                      text: type,
                                                    },
                                                  ]);
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                                onSkip={() => {
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                              />
                                            );
                                            scrollToInline();
                                          });
                                        }}
                                        onSkip={() => {
                                          setInlineComponent(null);
                                          addAIMessage(
                                            "Remote type? (Remote, Hybrid, On-site — or skip)"
                                          ).then(() => {
                                            setCurrentField(
                                              JOB_FIELDS.REMOTE_TYPE
                                            );
                                            setInlineComponent(
                                              <RemoteTypeSelector
                                                selectedValue={
                                                  jobData?.remoteType || null
                                                }
                                                onSelect={(type) => {
                                                  setJobData((prev) => ({
                                                    ...prev,
                                                    remoteType: type,
                                                  }));
                                                  setChatMessages((prev) => [
                                                    ...prev,
                                                    {
                                                      type: "user",
                                                      text: type,
                                                    },
                                                  ]);
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                                onSkip={() => {
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                              />
                                            );
                                            scrollToInline();
                                          });
                                        }}
                                        selectedMin={jobData?.salaryMin}
                                        selectedMax={jobData?.salaryMax}
                                      />
                                    );
                                    scrollToInline();
                                  }
                                );
                              }}
                              selectedValue={jobData?.yearsRequired}
                            />
                          );
                          scrollToInline();
                        }
                      );
                    }}
                    className="px-4 py-2 rounded-lg border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill text-sm"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            );
            scrollToInline();
            break;

          case JOB_FIELDS.REMOTE_TYPE:
            if (value.toLowerCase() !== "skip" && value) {
              setJobData((prev) => ({ ...prev, remoteType: value }));
            }
            await addAIMessage(
              "Seniority level? (e.g. Entry, Mid, Senior — or skip)"
            );
            setCurrentField(JOB_FIELDS.SENIORITY);
            break;

          case JOB_FIELDS.SENIORITY:
            if (value.toLowerCase() !== "skip" && value) {
              setJobData((prev) => ({ ...prev, seniorityLevel: value }));
            }
            goToApplicationLinkStep();
            break;

          case JOB_FIELDS.APPLICATION_LINK:
            if (value.toLowerCase() !== "skip" && value) {
              const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
              setJobData((prev) => ({ ...prev, applicationUrl: normalized }));
            }
            await addAIMessage("Submitting job posting...");
            await handleJobSubmit();
            break;

          default:
            break;
        }
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {jobListingOpen && (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-brand-stroke-weak bg-brand-bg-white overflow-hidden">
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-brand-stroke-weak">
            <img src="/logo.svg" alt="mapmyGig" className="h-8 w-auto" style={{ width: "auto", height: "2rem" }} aria-hidden />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenJobListing}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium transition-colors ${
                  jobListingOpen ? "bg-brand-bg-fill" : "hover:bg-brand-bg-fill"
                }`}
              >
                Job Listing
              </button>
              <button
                type="button"
                onClick={() => {
                  setJobListingOpen(false);
                  handleResetChat();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium transition-colors ${
                  !jobListingOpen ? "bg-brand-bg-fill" : "hover:bg-brand-bg-fill"
                }`}
                title="Start a new job posting"
              >
                <WatsonHealthRotate_360 size={18} />
                New Job Posting
              </button>
            </div>
          </div>
          <div className="flex border-b border-brand-stroke-weak shrink-0">
            <button
              type="button"
              onClick={() => handleJobListingTabChange("recent")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                jobListingTab === "recent"
                  ? "bg-brand-bg-fill text-brand-text-strong border-b-2 border-brand-stroke-strong -mb-px"
                  : "text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-text-strong"
              }`}
            >
              Recent Jobs
            </button>
            <button
              type="button"
              onClick={() => handleJobListingTabChange("all")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                jobListingTab === "all"
                  ? "bg-brand-bg-fill text-brand-text-strong border-b-2 border-brand-stroke-strong -mb-px"
                  : "text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-text-strong"
              }`}
            >
              All Jobs
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {jobListingTab === "recent" && loadingRecent && (
              <p className="text-sm text-brand-text-weak">Loading recent jobs…</p>
            )}
            {jobListingTab === "recent" && !loadingRecent && (
              <JobListingPanelJobs
                jobs={jobListingRecentJobs}
                emptyMessage="No jobs posted today yet."
                onSeeOnMap={handleJobListingSeeOnMap}
                onExtend={handleJobListingExtend}
                extendingId={jobListingExtendingId}
                onEdit={(job) => {
                  setJobListingToEdit(job);
                  setJobListingEditModalOpen(true);
                }}
                onDelete={(job) => {
                  setJobListingToDelete(job);
                  setJobListingDeleteConfirmOpen(true);
                }}
              />
            )}
            {jobListingTab === "all" && loadingAll && (
              <p className="text-sm text-brand-text-weak">Loading all jobs…</p>
            )}
            {jobListingTab === "all" && !loadingAll && (
              <JobListingPanelJobs
                jobs={jobListingAllJobs}
                emptyMessage="No posted jobs yet."
                onSeeOnMap={handleJobListingSeeOnMap}
                onExtend={handleJobListingExtend}
                extendingId={jobListingExtendingId}
                onEdit={(job) => {
                  setJobListingToEdit(job);
                  setJobListingEditModalOpen(true);
                }}
                onDelete={(job) => {
                  setJobListingToDelete(job);
                  setJobListingDeleteConfirmOpen(true);
                }}
              />
            )}
          </div>
        </div>
      )}
      {!jobListingOpen && (
        <div className="flex-1 min-h-0 rounded-lg border border-brand-stroke-weak bg-brand-bg-white overflow-hidden flex flex-col">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            isLoading={isLoading}
            inlineComponent={inlineComponent}
            typingText={typingText || null}
            onScrollRequest={(fn) => {
              scrollToInlineRef.current = fn;
            }}
            onViewOnMap={lastJobCoords ? handleViewOnMap : undefined}
            onStartNext={handleStartNext}
            showFindOrPostButtons={false}
            onJobDeleted={handleAdminJobDeleted}
            onJobEdited={handleAdminJobEdited}
            jobApiPrefix="/api/admin/jobs"
            openMapInNewTab={true}
            compactInput={true}
            headerRightContent={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenJobListing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium transition-colors ${
                    jobListingOpen ? "bg-brand-bg-fill" : "hover:bg-brand-bg-fill"
                  }`}
                >
                  Job Listing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJobListingOpen(false);
                    handleResetChat();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium transition-colors ${
                    !jobListingOpen ? "bg-brand-bg-fill" : "hover:bg-brand-bg-fill"
                  }`}
                  title="Start a new job posting"
                >
                  <WatsonHealthRotate_360 size={18} />
                  New Job Posting
                </button>
              </div>
            }
          />
        </div>
      )}
      <ConfirmDeleteModal
        isOpen={jobListingDeleteConfirmOpen}
        onClose={() => {
          setJobListingDeleteConfirmOpen(false);
          setJobListingToDelete(null);
        }}
        onConfirm={() => jobListingToDelete && handleJobListingDelete(jobListingToDelete.id)}
        title="Delete this job?"
        message="This will remove the job from the map and listings. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDeleting={!!jobListingDeletingId}
      />
      {jobListingToEdit && (
        <EditJobModal
          isOpen={jobListingEditModalOpen}
          onClose={() => {
            setJobListingEditModalOpen(false);
            setJobListingToEdit(null);
          }}
          job={jobListingToEdit}
          onSaved={(updated) => {
            handleJobListingEdited(updated);
            setJobListingEditModalOpen(false);
            setJobListingToEdit(null);
          }}
          jobApiPrefix="/api/admin/jobs"
        />
      )}
    </div>
  );
}
