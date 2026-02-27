"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Screen, Document, Enterprise, Save, Location, Add, OverflowMenuVertical, TrashCan, Edit, List, Renew } from "@carbon/icons-react";
import TypingAnimation from "./TypingAnimation";
import { getAvatarUrlById } from "../../../lib/avatars";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import EditGigModal from "./EditGigModal";
import EditJobModal from "../EditJobModal";

export default function ChatInterface({
  messages = [],
  onSendMessage,
  isLoading = false,
  inlineComponent = null,
  typingText = null,
  onScrollRequest,
  onSave,
  onViewOnMap,
  onStartNext,
  showFindOrPostButtons = false,
  accountType,
  onFindJob,
  onPostGig,
  onFindCandidates,
  onGigDeleted,
  onGigEdited,
  onJobDeleted,
  onJobEdited,
  onShowJobListings,
  jobApiPrefix = "/api/jobs",
  openMapInNewTab = false,
  headerRightContent = null,
  compactInput = false,
}) {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showClipTooltip, setShowClipTooltip] = useState(false);
  const [showSavedFilesDropdown, setShowSavedFilesDropdown] = useState(false);
  const [savedFiles, setSavedFiles] = useState([]);
  const savedFilesDropdownRef = useRef(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [gigToDelete, setGigToDelete] = useState(null);
  const [deletingGigId, setDeletingGigId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [gigToEdit, setGigToEdit] = useState(null);
  const [jobDeleteConfirmOpen, setJobDeleteConfirmOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [jobEditModalOpen, setJobEditModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [extendingJobId, setExtendingJobId] = useState(null);

  const handleJobSeeOnMap = async (job) => {
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
    if (openMapInNewTab) {
      try {
        await fetch("/api/admin/set-view-as", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: "individual" }),
        });
      } catch (_) {}
      window.open("/", "_blank");
    } else {
      router.push("/");
    }
  };

  const handleViewGigOnMap = (gig) => {
    if (gig.latitude != null && gig.longitude != null) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          "zoomToGigCoords",
          JSON.stringify({
            lat: gig.latitude,
            lng: gig.longitude,
            state: gig.state || null,
            district: gig.district || null,
          })
        );
      }
      router.push("/");
    }
  };

  const handleDeleteJob = async (jobId) => {
    setDeletingJobId(jobId);
    try {
      const res = await fetch(`${jobApiPrefix}/${jobId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        setJobDeleteConfirmOpen(false);
        setJobToDelete(null);
        if (onJobDeleted) onJobDeleted(jobId);
      } else {
        console.error("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleExtendJob = async (jobId) => {
    setExtendingJobId(jobId);
    try {
      const res = await fetch(`${jobApiPrefix}/${jobId}/extend`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        if (onJobEdited) onJobEdited(data.job);
      } else {
        console.error("Failed to extend job");
      }
    } catch (error) {
      console.error("Error extending job:", error);
    } finally {
      setExtendingJobId(null);
    }
  };

  const openDeviceFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setUploadedFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, file: f }))]);
    e.target.value = "";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Expose scroll function for external use (e.g., when dropdown opens)
  useEffect(() => {
    if (onScrollRequest) {
      // Store the scroll function so it can be called from parent
      const scrollToInline = () => {
        if (messagesContainerRef.current) {
          const inlineElement = messagesContainerRef.current.querySelector('[data-inline-component]');
          if (inlineElement) {
            setTimeout(() => {
              inlineElement.scrollIntoView({ behavior: "smooth", block: "end" });
              setTimeout(() => {
                messagesContainerRef.current?.scrollBy({ top: 220, behavior: "smooth" });
              }, 300);
            }, 100);
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        }
      };
      onScrollRequest(scrollToInline);
    }
  }, [inlineComponent, onScrollRequest]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close saved files dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (savedFilesDropdownRef.current && !savedFilesDropdownRef.current.contains(event.target)) {
        setShowSavedFilesDropdown(false);
      }
    };

    if (showSavedFilesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSavedFilesDropdown]);

  // Fetch saved files (placeholder - can be connected to API later)
  useEffect(() => {
    const fetchSavedFiles = async () => {
      try {
        // const response = await fetch('/api/saved-files');
        // const data = await response.json();
        // setSavedFiles(data.files || []);
        setSavedFiles([]); // Placeholder
      } catch (error) {
        console.error("Error fetching saved files:", error);
      }
    };
    fetchSavedFiles();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input && input.value.trim()) {
      onSendMessage(input.value.trim());
      input.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-lg relative overflow-hidden">
      {/* Logo - Sticky at Top */}
      <div className="sticky top-0 z-10 shrink-0 bg-white px-4 py-3 border-b border-brand-stroke-weak">
        <div className="flex items-center justify-between gap-2">
          <div className="h-8 flex items-center">
            <Image
              src="/logo.svg"
              alt="mapmyGig"
              width={128}
              height={32}
              className="h-8 w-auto"
              style={{ width: "auto", height: "2rem" }}
            />
          </div>
          {headerRightContent != null ? headerRightContent : null}
        </div>
      </div>

      {/* Messages Container - scrollable, leaves room for input */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-4 space-y-4 chat-scrollable bg-white"
      >

        {messages.map((message, index) => (
          <div key={index} className="w-full">
            {message.type === "jobList" ? (
              <div className="flex items-start gap-2 justify-start">
                <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                  <Image
                    src="/onlylogo.svg"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-full min-w-0">
                <div className="w-full min-w-0 rounded-lg border border-brand-stroke-weak bg-brand-bg-white px-4 py-3">
                  <p className="text-sm font-medium text-brand-text-strong mb-3" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    Your job postings
                  </p>
                  {(message.jobs || []).length === 0 ? (
                    <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>No job postings yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(message.jobs || []).map((job) => {
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
                            {(companyName || logoUrl) ? (
                              <div className="flex items-center gap-2 mb-1.5 shrink-0">
                                <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-brand-bg-fill flex items-center justify-center">
                                  {logoUrl ? (
                                    <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-xs font-medium text-brand-text-strong" style={{ fontFamily: "Open Sans, sans-serif" }}>
                                      {(companyName || "?").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-xs text-brand-text-strong truncate min-w-0"
                                  style={{ fontFamily: "Open Sans, sans-serif" }}
                                >
                                  {companyName || "Company"}
                                </p>
                              </div>
                            ) : null}
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
                            {job.company?.latitude != null && job.company?.longitude != null ? (
                              <button
                                type="button"
                                onClick={() => handleJobSeeOnMap(job)}
                                className="p-1.5 rounded-md text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-stroke-strong transition-colors"
                                title="See on map"
                                aria-label="See on map"
                              >
                                <Location size={18} />
                              </button>
                            ) : null}
                            {onJobEdited ? (
                              <button
                                type="button"
                                onClick={() => handleExtendJob(job.id)}
                                disabled={extendingJobId === job.id}
                                className="p-1.5 rounded-md text-brand-text-weak hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50 relative"
                                title="Extend posting by 2 weeks"
                                aria-label="Extend job"
                              >
                                {extendingJobId === job.id ? (
                                  <div className="w-[18px] h-[18px] border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Renew size={18} />
                                )}
                              </button>
                            ) : null}
                            {onJobEdited ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setJobToEdit(job);
                                  setJobEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-md text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-stroke-strong transition-colors"
                                title="Edit job"
                                aria-label="Edit job"
                              >
                                <Edit size={18} />
                              </button>
                            ) : null}
                            {onJobDeleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setJobToDelete(job);
                                  setJobDeleteConfirmOpen(true);
                                }}
                                disabled={deletingJobId === job.id}
                                className="p-1.5 rounded-md text-brand-text-weak hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 relative"
                                title="Delete job"
                                aria-label="Delete job"
                              >
                                {deletingJobId === job.id ? (
                                  <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <TrashCan size={18} />
                                )}
                              </button>
                            ) : null}
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                </div>
              </div>
            ) : message.type === "gigList" ? (
              <div className="flex items-start gap-2 justify-start">
                <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                  <Image
                    src="/onlylogo.svg"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="w-full rounded-lg border border-brand-stroke-weak bg-brand-bg-white px-4 py-3">
                    <p className="text-sm font-medium text-brand-text-strong mb-3" style={{ fontFamily: "Open Sans, sans-serif" }}>
                      Your posted gigs
                    </p>
                    {(message.gigs || []).length === 0 ? (
                      <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>No gigs posted yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(message.gigs || []).map((gig) => {
                          const avatarUrl = gig.user?.avatarId
                            ? getAvatarUrlById(gig.user.avatarId)
                            : gig.user?.avatarUrl || "/avatars/avatar1.png";
                          const hasCoordinates = gig.latitude != null && gig.longitude != null && Number.isFinite(Number(gig.latitude)) && Number.isFinite(Number(gig.longitude));
                          
                          return (
                            <li
                              key={gig.id}
                              className="flex items-center gap-3 py-2 border-b border-brand-stroke-weak last:border-b-0 last:pb-0 first:pt-0"
                            >
                              {/* User Avatar on Left */}
                              <div className="flex-shrink-0">
                                <Image
                                  src={avatarUrl}
                                  alt={gig.user?.name || "User"}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-stroke-weak"
                                />
                              </div>
                              {/* Gig Details in Center */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-brand-text-strong truncate" style={{ fontFamily: "Open Sans, sans-serif" }}>{gig.title}</p>
                                <p className="text-xs text-brand-text-weak truncate mt-0.5" style={{ fontFamily: "Open Sans, sans-serif" }}>{gig.serviceType || ""}</p>
                                <p className="text-xs text-brand-text-weak mt-0.5" style={{ fontFamily: "Open Sans, sans-serif" }}>
                                  Posted: {new Date(gig.createdAt).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              {/* See on map + Edit + Delete on Right */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                {hasCoordinates ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewGigOnMap(gig)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white hover:bg-brand-hover rounded-md text-xs font-medium transition-colors cursor-pointer"
                                    style={{ fontFamily: "Open Sans, sans-serif" }}
                                  >
                                    <Location size={14} />
                                    <span>See on map</span>
                                  </button>
                                ) : null}
                                {onGigEdited ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGigToEdit(gig);
                                      setEditModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-md text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-stroke-strong transition-colors"
                                    title="Edit gig"
                                    aria-label="Edit gig"
                                  >
                                    <Edit size={18} />
                                  </button>
                                ) : null}
                                {onGigDeleted ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGigToDelete(gig);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    disabled={deletingGigId === gig.id}
                                    className="p-1.5 rounded-md text-brand-text-weak hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 relative"
                                    title="Delete gig"
                                    aria-label="Delete gig"
                                  >
                                    {deletingGigId === gig.id ? (
                                      <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <TrashCan size={18} />
                                    )}
                                  </button>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <div
              className={`flex items-start gap-2 ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type === "user" ? (
                <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                  <Enterprise size={28} className="text-brand-stroke-strong" />
                </div>
              ) : (
                <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                  <Image
                    src="/onlylogo.svg"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.type === "user"
                      ? "bg-brand-bg-fill text-brand-text-strong"
                      : index === 0 && message.type === "ai"
                      ? "bg-white text-brand-text-strong"
                      : "bg-brand-bg-fill text-brand-text-strong"
                  }`}
                  style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: index === 0 && message.type === "ai" ? "15px" : "14px",
                    lineHeight: "1.5",
                    fontWeight: index === 0 && message.type === "ai" ? 500 : 400,
                  }}
                >
                  {message.text}
                  {message.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={message.imageUrl}
                        alt="Uploaded"
                        className="rounded-lg max-h-32 object-cover border border-brand-stroke-weak"
                        style={{ maxWidth: "200px" }}
                      />
                    </div>
                  )}
                </div>
                {/* Find a job / Post a gig (Individual) or Post your job / Find Candidates (Company) - show after first welcome message only */}
                {message.type === "ai" && index === 0 && showFindOrPostButtons && (accountType === "Company" ? (onPostGig || onFindCandidates) : (onFindJob && onPostGig)) && (
                  <div className="flex flex-col gap-2 mt-2">
                    <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
                      {accountType === "Company" ? "What would you like to do?" : "Do you want to find a job or post a gig?"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accountType === "Company" ? (
                        <>
                          {onPostGig && (
                            <button
                              type="button"
                              onClick={onPostGig}
                              className="flex items-center gap-2 px-4 py-2.5 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-sm font-medium transition-colors border border-brand-stroke-weak"
                              style={{ fontFamily: "Open Sans, sans-serif" }}
                            >
                              <Add size={16} className="text-brand-stroke-strong" />
                              <span>Post your job</span>
                            </button>
                          )}
                          {onFindCandidates && (
                            <button
                              type="button"
                              onClick={onFindCandidates}
                              className="flex items-center gap-2 px-4 py-2.5 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-sm font-medium transition-colors border border-brand-stroke-weak"
                              style={{ fontFamily: "Open Sans, sans-serif" }}
                            >
                              <Location size={16} className="text-brand-stroke-strong" />
                              <span>Find Candidates</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={onFindJob}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-sm font-medium transition-colors border border-brand-stroke-weak"
                            style={{ fontFamily: "Open Sans, sans-serif" }}
                          >
                            <Location size={16} className="text-brand-stroke-strong" />
                            <span>Find a job</span>
                          </button>
                          <button
                            type="button"
                            onClick={onPostGig}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-sm font-medium transition-colors border border-brand-stroke-weak"
                            style={{ fontFamily: "Open Sans, sans-serif" }}
                          >
                            <Add size={16} className="text-brand-stroke-strong" />
                            <span>Post a gig</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {/* Action buttons for AI messages */}
                {message.type === "ai" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Save button - show for all AI messages except the first welcome message and final success message */}
                    {onSave && !message.isFinalMessage && index !== 0 && (
                      <button
                        onClick={() => onSave(index)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-xs transition-colors border border-brand-stroke-weak"
                        style={{ fontFamily: "Open Sans, sans-serif" }}
                      >
                        <Save size={14} className="text-brand-stroke-strong" />
                        <span>Save</span>
                      </button>
                    )}
                    {/* Final message action buttons */}
                    {message.isFinalMessage && (
                      <>
                        {onViewOnMap && (
                          <button
                            onClick={onViewOnMap}
                            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-bg-white hover:bg-brand-hover rounded-md text-sm font-medium transition-colors"
                            style={{ fontFamily: "Open Sans, sans-serif" }}
                          >
                            <Location size={16} />
                            <span>{message.isGigSuccess ? "See your gig on the map" : "See your posting on the map"}</span>
                          </button>
                        )}
                        {onStartNext && (
                          <button
                            onClick={onStartNext}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md text-sm font-medium transition-colors border border-brand-stroke-weak"
                            style={{ fontFamily: "Open Sans, sans-serif" }}
                          >
                            <Add size={16} className="text-brand-stroke-strong" />
                            <span>Start next job post</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ))}
        {typingText && (
          <div className="flex items-start gap-2 justify-start">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center">
              <Image
                src="/onlylogo.svg"
                alt="Logo"
                width={28}
                height={28}
                className="w-7 h-7"
              />
            </div>
            <div className="flex flex-col gap-2 max-w-[80%]">
              <div className="rounded-lg px-4 py-2 bg-brand-bg-fill text-brand-text-strong">
                {typingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          </div>
        )}
        {inlineComponent && (
          <div className="flex items-start gap-2 justify-start" data-inline-component>
            <div className="flex-shrink-0 mt-1 flex items-center justify-center">
              <Image
                src="/onlylogo.svg"
                alt="Logo"
                width={28}
                height={28}
                className="w-7 h-7"
              />
            </div>
            <div className="flex flex-col gap-2 max-w-[80%] w-full">
              {inlineComponent}
            </div>
          </div>
        )}
        {isLoading && !typingText && (
          <div className="flex items-start gap-2 justify-start">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center">
              <Image
                src="/onlylogo.svg"
                alt="Logo"
                width={28}
                height={28}
                className="w-7 h-7"
              />
            </div>
            <div className="flex flex-col gap-2 max-w-[80%]">
              <TypingAnimation />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-[#E5E5E5] bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-brand-stroke-weak rounded-md text-sm text-brand-text-strong"
              >
                <span>{file.name}</span>
                <button
                  onClick={() => {
                    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                  }}
                  className="text-brand-text-weak hover:text-brand-text-strong"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - always visible on mobile; safe-area padding; scroll into view when keyboard opens */}
      <div
        className="shrink-0 border-t border-[#E5E5E5] px-4 py-3 md:py-4 bg-white"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            placeholder="Type your message..."
            className={`w-full pl-2 pr-2 bg-brand-bg-white border border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill resize-none text-base m-0 placeholder:text-brand-text-placeholder text-brand-text-strong ${
              compactInput
                ? "min-h-[44px] md:min-h-[60px] py-2 md:py-2"
                : "min-h-[88px] md:min-h-[120px] py-3 md:py-4"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
            disabled={isLoading}
            onFocus={() => {
              setTimeout(() => {
                inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
              }, 300);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          {/* Hidden file input - used by mobile single icon and desktop attachment */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            className="hidden"
            aria-hidden="true"
            onChange={handleFileInputChange}
          />

          {/* Icons at Left Bottom - Mobile: @ and + only; Desktop: @, Screenshot, Attachment */}
          <div className="absolute bottom-4 left-2 flex items-center gap-2 z-10" ref={savedFilesDropdownRef}>
            {/* Mobile only: @ and + (Add) */}
            <div className="relative flex items-center gap-2 md:hidden">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSavedFilesDropdown(!showSavedFilesDropdown)}
                  className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                  disabled={isLoading}
                  title="Show saved files"
                >
                  <span className="text-brand-stroke-strong text-lg font-semibold">@</span>
                </button>
                {showSavedFilesDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {savedFiles.length > 0 ? (
                      <div className="py-2">
                        {savedFiles.map((file, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setShowSavedFilesDropdown(false)}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors flex items-center gap-2"
                            style={{ fontFamily: "Open Sans, sans-serif" }}
                          >
                            <Document size={16} className="text-brand-stroke-strong" />
                            <span className="truncate">{file.name || file}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-brand-text-weak text-center" style={{ fontFamily: "Open Sans, sans-serif" }}>
                        No saved files
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={openDeviceFilePicker}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
                title="Attach file"
                aria-label="Attach file"
              >
                <Add size={20} className="text-brand-stroke-strong" />
              </button>
            </div>

            {/* Desktop: @ Saved Files */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setShowSavedFilesDropdown(!showSavedFilesDropdown)}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
                title="Show saved files"
              >
                <span className="text-brand-stroke-strong text-lg font-semibold">@</span>
              </button>
              {showSavedFilesDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {savedFiles.length > 0 ? (
                    <div className="py-2">
                      {savedFiles.map((file, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setShowSavedFilesDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors flex items-center gap-2"
                          style={{ fontFamily: "Open Sans, sans-serif" }}
                        >
                          <Document size={16} className="text-brand-stroke-strong" />
                          <span className="truncate">{file.name || file}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-brand-text-weak text-center" style={{ fontFamily: "Open Sans, sans-serif" }}>
                      No saved files
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Screenshot Icon - hidden on mobile */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {}}
                onMouseEnter={() => setShowScreenshotTooltip(true)}
                onMouseLeave={() => setShowScreenshotTooltip(false)}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
              >
                <Screen size={20} className="text-brand-stroke-strong" />
              </button>
              {showScreenshotTooltip && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-brand-text-strong text-brand-bg-white text-xs rounded-md whitespace-nowrap z-50">
                  Take screenshot and paste
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-text-strong"></div>
                </div>
              )}
            </div>

            {/* Desktop: Attachment Icon - hidden on mobile (mobile uses single icon above) */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={openDeviceFilePicker}
                onMouseEnter={() => setShowClipTooltip(true)}
                onMouseLeave={() => setShowClipTooltip(false)}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
              >
                <Document size={20} className="text-brand-stroke-strong" />
              </button>
              {showClipTooltip && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-brand-text-strong text-brand-bg-white text-xs rounded-md whitespace-nowrap z-50">
                  Attach documents or files
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-text-strong"></div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="absolute bottom-4 right-2 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md z-20 bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setGigToDelete(null);
        }}
        onConfirm={async () => {
          if (!gigToDelete) return;
          setDeletingGigId(gigToDelete.id);
          setDeleteConfirmOpen(false);

          try {
            const res = await fetch(`/api/gigs/${gigToDelete.id}`, {
              method: "DELETE",
              credentials: "same-origin",
            });
            const data = await res.json().catch(() => ({ success: false }));
            
            if (res.ok && data.success) {
              // Trigger map refresh via custom event (map listens for this)
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("gigDeleted", { detail: { gigId: gigToDelete.id } }));
              }
              // Call parent callback to refresh chat list
              onGigDeleted?.();
            } else {
              // If delete failed, restore the gig in the list
              const errorMsg = data.error || "Failed to delete gig";
              console.error("Delete failed:", errorMsg);
              // Refetch to restore correct state
              onGigDeleted?.();
              // Optionally show error to user
              alert(`Failed to delete gig: ${errorMsg}`);
            }
          } catch (err) {
            console.error("Delete failed:", err);
            // Refetch on error to restore correct state
            onGigDeleted?.();
            alert("Failed to delete gig. Please try again.");
          } finally {
            setDeletingGigId(null);
            setGigToDelete(null);
          }
        }}
        title="Delete this gig?"
        message="This will remove the gig from all instances, database, and the map. This cannot be undone."
      />

      <EditGigModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setGigToEdit(null);
        }}
        gig={gigToEdit}
        onSaved={() => {
          onGigEdited?.();
        }}
      />

      <ConfirmDeleteModal
        isOpen={jobDeleteConfirmOpen}
        onClose={() => {
          setJobDeleteConfirmOpen(false);
          setJobToDelete(null);
        }}
        onConfirm={() => handleDeleteJob(jobToDelete?.id)}
        title="Delete Job Posting"
        message={`Are you sure you want to delete "${jobToDelete?.title}"? This action cannot be undone.`}
        isDeleting={deletingJobId === jobToDelete?.id}
      />

      <EditJobModal
        isOpen={jobEditModalOpen}
        onClose={() => {
          setJobEditModalOpen(false);
          setJobToEdit(null);
        }}
        job={jobToEdit}
        jobApiPrefix={jobApiPrefix}
        onSaved={(updatedJob) => {
          setJobEditModalOpen(false);
          setJobToEdit(null);
          if (onJobEdited) onJobEdited(updatedJob);
        }}
      />
    </div>
  );
}
