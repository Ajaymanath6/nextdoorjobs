"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import {
  Close,
  Settings,
  Receipt,
  DataConnected,
  SettingsAdjust,
  Edit,
  Add,
  Location,
  Document,
  ArrowRight,
  Checkmark,
} from "@carbon/icons-react";
import EditDisplayNameModal from "./EditDisplayNameModal";
import EditCompanyLocationModal from "./EditCompanyLocationModal";
import AddHomeModal from "./Map/AddHomeModal";
import themeClasses from "../theme-utility-classes.json";
import { AVATARS } from "../../lib/avatars";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings },
  { id: "resume", label: "Resume", icon: Document },
  { id: "company", label: "Company Details", icon: Receipt },
  { id: "subscription", label: "Subscription", icon: Receipt },
  { id: "integration", label: "Integration", icon: DataConnected, disabled: true },
  { id: "other", label: "Other", icon: SettingsAdjust, disabled: true },
];

const VALID_SECTIONS = ["general", "resume", "company", "subscription", "integration", "other"];

const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    subheading: "For gig workers getting started",
    badge: "Popular",
    price: 320,
    priceLabel: "/ year",
    features: [
      "Unlimited AI chat",
      "5 lecture transcriptions / day",
      "5 flashcard & practice sets / day",
      "3 video generations / day",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    subheading: "For serious job seekers",
    badge: "Best value",
    price: 800,
    priceLabel: "/ year",
    features: [
      "Everything in Starter",
      "Unlimited transcriptions",
      "Unlimited flashcard & practice sets",
      "Unlimited video generations",
      "Priority support",
    ],
  },
];

const SUBSCRIPTION_CHECKOUT_URL = process.env.NEXT_PUBLIC_SUBSCRIPTION_CHECKOUT_URL || "";

export default function SettingsModal({ isOpen, onClose, initialSection }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("general");

  // When modal opens with initialSection, switch to that tab
  useEffect(() => {
    if (isOpen && initialSection && VALID_SECTIONS.includes(initialSection)) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [addEmailValue, setAddEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [showCompanyLogoModal, setShowCompanyLogoModal] = useState(false);
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);
  const [companyLogoError, setCompanyLogoError] = useState(null);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showEditHomeModal, setShowEditHomeModal] = useState(false);
  const [showViewResumeModal, setShowViewResumeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [firstGigForLocation, setFirstGigForLocation] = useState(null);
  const fileInputRef = useRef(null);
  const companyLogoInputRef = useRef(null);
  const resumeFileInputRef = useRef(null);
  const [resume, setResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [resumeForm, setResumeForm] = useState({
    firstName: "",
    lastName: "",
    emailOverride: "",
    currentPosition: "",
    yearsExperience: "",
    workExperiences: [{ companyName: "", companyUrl: "", position: "", duties: "", year: "" }],
    educations: [{ universityName: "", streamName: "", marksOrScore: "", yearOfPassing: "" }],
    expectedSalaryPackage: "",
    currentSalaryPackage: "",
    currentSalaryVisibleToRecruiter: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
          // Fetch companies if user is a Company account
          if (data.user.accountType === "Company") {
            fetchCompanies();
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const fetchCompanies = async () => {
    setCompanyLoading(true);
    try {
      const res = await fetch("/api/onboarding/company", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.companies) {
          setCompanies(data.companies);
          // Select first company by default
          if (data.companies.length > 0) {
            setSelectedCompany(data.companies[0]);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching companies:", e);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleSavedName = (updatedUser) => {
    if (updatedUser) setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  const refreshUser = () => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) setUser(data.user);
      })
      .catch(() => {});
  };

  // Fetch first gig for location display when General section is open and user is Individual with no home
  useEffect(() => {
    if (!isOpen || activeSection !== "general" || user?.accountType !== "Individual") {
      setFirstGigForLocation(null);
      return;
    }
    // Only fetch if user has no home location
    if (user?.homeLatitude == null && user?.homeLongitude == null) {
      fetch("/api/gigs?mine=1", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.gigs) && data.gigs.length > 0) {
            const firstGig = data.gigs[0];
            // Only store if gig has location data
            if (firstGig.district || firstGig.state || firstGig.locality || firstGig.pincode) {
              setFirstGigForLocation(firstGig);
            } else {
              setFirstGigForLocation(null);
            }
          } else {
            setFirstGigForLocation(null);
          }
        })
        .catch(() => setFirstGigForLocation(null));
    } else {
      setFirstGigForLocation(null);
    }
  }, [isOpen, activeSection, user?.accountType, user?.homeLatitude, user?.homeLongitude]);

  // Sync phone input from user when in General
  useEffect(() => {
    if (user && activeSection === "general") {
      setPhoneValue(user.phone ?? "");
    }
  }, [user?.phone, activeSection, user?.id]);

  useEffect(() => {
    if (!isOpen || activeSection !== "resume" || user?.accountType !== "Individual") return;
    setResumeLoading(true);
    fetch("/api/profile/resume", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : res.status === 404 ? null : Promise.reject(res)))
      .then((data) => {
        if (data?.success && data.resume) {
          const r = data.resume;
          setResume(r);
          const work = (r.workExperiences && r.workExperiences.length) ? r.workExperiences : [{ companyName: "", companyUrl: "", position: "", duties: "", year: "" }];
          const edu = (r.educations && r.educations.length) ? r.educations : [{ universityName: "", streamName: "", marksOrScore: "", yearOfPassing: "" }];
          setResumeForm({
            firstName: r.firstName ?? "",
            lastName: r.lastName ?? "",
            emailOverride: r.emailOverride != null && r.emailOverride !== "" ? r.emailOverride : (user?.email ?? ""),
            currentPosition: r.currentPosition ?? "",
            yearsExperience: r.yearsExperience ?? "",
            workExperiences: work.map((w) => ({
              companyName: w.companyName ?? "",
              companyUrl: w.companyUrl ?? "",
              position: w.position ?? "",
              duties: w.duties ?? "",
              year: w.year ?? "",
            })),
            educations: edu.map((e) => ({
              universityName: e.universityName ?? "",
              streamName: e.streamName ?? "",
              marksOrScore: e.marksOrScore ?? "",
              yearOfPassing: e.yearOfPassing ?? "",
            })),
            expectedSalaryPackage: r.expectedSalaryPackage ?? "",
            currentSalaryPackage: r.currentSalaryPackage ?? "",
            currentSalaryVisibleToRecruiter: r.currentSalaryVisibleToRecruiter ?? false,
          });
        } else {
          setResume(null);
          setResumeForm({
            firstName: "",
            lastName: "",
            emailOverride: user?.email ?? "",
            currentPosition: "",
            yearsExperience: "",
            workExperiences: [{ companyName: "", companyUrl: "", position: "", duties: "", year: "" }],
            educations: [{ universityName: "", streamName: "", marksOrScore: "", yearOfPassing: "" }],
            expectedSalaryPackage: "",
            currentSalaryPackage: "",
            currentSalaryVisibleToRecruiter: false,
          });
        }
      })
      .catch(() => setResume(null))
      .finally(() => setResumeLoading(false));
  }, [isOpen, activeSection, user?.accountType]);

  const handleResumeFileSelect = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/resume/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.path) {
        setResume((prev) => (prev ? { ...prev, resumeFilePath: data.path } : { resumeFilePath: data.path }));
      }
    } catch (err) {
      console.error("Resume upload error:", err);
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  // Clear error/success messages when user starts editing
  const clearResumeMessages = () => {
    if (resumeError) setResumeError(null);
    if (resumeSuccess) setResumeSuccess(false);
  };

  // Input validation helpers
  const handleNumericInput = (value) => {
    // Only allow digits
    return value.replace(/[^0-9]/g, '');
  };

  const handleTextInput = (value) => {
    // Only allow letters, spaces, hyphens, apostrophes, periods, and commas
    return value.replace(/[^a-zA-Z\s\-'.,]/g, '');
  };

  const saveResume = async () => {
    setResumeSaving(true);
    setResumeError(null);
    setResumeSuccess(false);
    try {
      const res = await fetch("/api/profile/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: resumeForm.firstName || null,
          lastName: resumeForm.lastName || null,
          emailOverride: resumeForm.emailOverride === (user?.email ?? "") ? null : (resumeForm.emailOverride || null),
          currentPosition: resumeForm.currentPosition || null,
          yearsExperience: resumeForm.yearsExperience || null,
          workExperiences: resumeForm.workExperiences.filter(
            (w) => w.companyName || w.companyUrl || w.position || w.duties || w.year
          ).map((w, i) => ({
            companyName: w.companyName,
            companyUrl: w.companyUrl,
            position: w.position,
            duties: w.duties,
            year: w.year,
          })),
          educations: resumeForm.educations.filter(
            (e) => e.universityName || e.streamName || e.marksOrScore || e.yearOfPassing
          ).map((e, i) => ({
            universityName: e.universityName,
            streamName: e.streamName,
            marksOrScore: e.marksOrScore,
            yearOfPassing: e.yearOfPassing,
          })),
          expectedSalaryPackage: resumeForm.expectedSalaryPackage || null,
          currentSalaryPackage: resumeForm.currentSalaryPackage || null,
          currentSalaryVisibleToRecruiter: resumeForm.currentSalaryVisibleToRecruiter,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const errorMessage = errorData.error || errorData.details || `Failed to save resume (${res.status})`;
        if (process.env.NODE_ENV === "development" && errorData.details) {
          console.error("Resume save API error details:", errorData);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.success) {
        const errorMessage = data.error || data.details || "Failed to save resume";
        if (process.env.NODE_ENV === "development" && data.details) {
          console.error("Resume save API error:", data);
        }
        throw new Error(errorMessage);
      }
      
      if (data.resume) {
        setResume(data.resume);
        // Update form state with saved data to ensure form reflects what was saved
        const work = (data.resume.workExperiences && data.resume.workExperiences.length)
          ? data.resume.workExperiences
          : [{ companyName: "", companyUrl: "", position: "", duties: "", year: "" }];
        const edu = (data.resume.educations && data.resume.educations.length)
          ? data.resume.educations
          : [{ universityName: "", streamName: "", marksOrScore: "", yearOfPassing: "" }];
        setResumeForm({
          firstName: data.resume.firstName ?? "",
          lastName: data.resume.lastName ?? "",
          emailOverride: data.resume.emailOverride != null && data.resume.emailOverride !== ""
            ? data.resume.emailOverride
            : (user?.email ?? ""),
          currentPosition: data.resume.currentPosition ?? "",
          yearsExperience: data.resume.yearsExperience ?? "",
          workExperiences: work.map((w) => ({
            companyName: w.companyName ?? "",
            companyUrl: w.companyUrl ?? "",
            position: w.position ?? "",
            duties: w.duties ?? "",
            year: w.year ?? "",
          })),
          educations: edu.map((e) => ({
            universityName: e.universityName ?? "",
            streamName: e.streamName ?? "",
            marksOrScore: e.marksOrScore ?? "",
            yearOfPassing: e.yearOfPassing ?? "",
          })),
          expectedSalaryPackage: data.resume.expectedSalaryPackage ?? "",
          currentSalaryPackage: data.resume.currentSalaryPackage ?? "",
          currentSalaryVisibleToRecruiter: data.resume.currentSalaryVisibleToRecruiter ?? false,
        });
        setResumeSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setResumeSuccess(false), 3000);
      } else {
        throw new Error(data.error || "Failed to save resume");
      }
    } catch (err) {
      console.error("Resume save error:", err);
      setResumeError(err.message || "Failed to save resume. Please try again.");
    } finally {
      setResumeSaving(false);
    }
  };

  const handleSelectAvatar = async (avatar) => {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: avatar.id }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setShowAvatarModal(false);
        refreshUser();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("avatar-updated"));
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.details || errBody?.error || `Request failed (${res.status})`;
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to save avatar:", res.status, errBody);
        }
        const userMsg =
          res.status === 401
            ? "Please sign in again and try again."
            : msg;
        setAvatarError(userMsg);
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to update avatar", e);
      }
      setAvatarError("Network or server error. Try again.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      // Step 1: Upload to imgbb via API
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadRes = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      
      if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
        const errorMsg = uploadData.error || `Upload failed (${uploadRes.status})`;
        setAvatarError(errorMsg);
        setAvatarUploading(false);
        return;
      }

      // Step 2: Save avatar URL
      const saveRes = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.url }),
        credentials: "same-origin",
      });

      if (saveRes.ok) {
        setShowAvatarModal(false);
        refreshUser();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("avatar-updated"));
        }
      } else {
        const errBody = await saveRes.json().catch(() => ({}));
        const msg = errBody?.details || errBody?.error || `Save failed (${saveRes.status})`;
        setAvatarError(msg);
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to upload avatar", e);
      }
      setAvatarError("Network or server error. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError("Please select an image file");
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File size must be less than 5MB");
      return;
    }

    handleAvatarUpload(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCompanyLogoUpload = async (file) => {
    if (!selectedCompany) return;
    
    setCompanyLogoUploading(true);
    setCompanyLogoError(null);
    
    try {
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch(`/api/onboarding/company/${selectedCompany.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "same-origin",
      });

      if (res.ok) {
        setShowCompanyLogoModal(false);
        await fetchCompanies();
      } else {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.error || `Upload failed (${res.status})`;
        setCompanyLogoError(msg);
      }
    } catch (e) {
      console.error("Failed to upload company logo", e);
      setCompanyLogoError("Network or server error. Try again.");
    } finally {
      setCompanyLogoUploading(false);
    }
  };

  const handleCompanyLogoInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setCompanyLogoError("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setCompanyLogoError("File size must be less than 5MB");
      return;
    }

    handleCompanyLogoUpload(file);
    e.target.value = '';
  };

  const displayName =
    (user?.name && String(user.name).trim()) ||
    (user?.email ? String(user.email).split("@")[0] : "") ||
    "—";
  const displayNameForEdit =
    (user?.name && String(user.name).trim()) ||
    (user?.email ? String(user.email).split("@")[0] : "") ||
    "";
  const emailDisplay = (user?.email && String(user.email)) || "—";

  const brand = themeClasses.brand;
  const inputClass =
    "w-full rounded-lg border border-brand-stroke-border px-3 py-2 text-sm text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div
          className="fixed left-1/2 top-1/2 z-[1002] flex h-[85vh] max-h-[85vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-brand-stroke-weak py-4">
            <h1 className="text-xl font-semibold text-brand-text-strong">
              Settings
            </h1>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={24} className="text-brand-stroke-strong" />
            </button>
          </div>

          {/* Body: sidebar + main - 24px gap */}
          <div className="flex min-h-0 flex-1 overflow-hidden gap-6">
            {/* Sidebar - no border */}
            <nav className="shrink-0 w-48 py-4 pr-0">
              <ul className="space-y-0.5">
                {SECTIONS.filter(section => {
                  if (section.id === "company") return user?.accountType === "Company";
                  if (section.id === "resume") return user?.accountType === "Individual";
                  if (section.id === "subscription") return user?.accountType === "Individual";
                  return true;
                }).map(({ id, label, icon: Icon, disabled }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => !disabled && setActiveSection(id)}
                      disabled={disabled}
                      className={`flex w-full items-center gap-3 px-6 py-2.5 text-left text-sm transition-colors rounded-xl ${
                        disabled
                          ? "cursor-not-allowed opacity-60 text-brand-text-weak"
                          : activeSection === id
                            ? "bg-brand/10 text-brand-text-strong font-medium"
                            : "text-brand-text-weak hover:bg-brand-bg-fill text-brand-text-strong"
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      <span className="flex-1">{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Main content - no left border */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-6 settings-modal-content">
              {loading ? (
                <p className="text-brand-text-weak">Loading…</p>
              ) : activeSection === "general" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
<h2 className="text-base font-semibold text-brand-text-strong">
                    My Account
                    </h2>
                    {user?.accountType && user.accountType.trim() !== "" && (
                      <span className="text-xs font-medium text-brand">
                        {user.accountType === "Individual" ? "Gig/Jobseeker" : user.accountType}
                      </span>
                    )}
                  </div>

                  {/* Profile picture - label left, avatar + Change photo right */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-brand-text-strong">
                      Profile picture
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-brand-bg-fill flex items-center justify-center border border-brand-stroke-border shrink-0">
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-brand-text-weak">
                            {user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarError(null);
                          setShowAvatarModal(true);
                        }}
                        className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                      >
                        Change photo
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-brand-stroke-weak" />

                  {/* Display name */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-brand-text-strong">
                      Display name
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-text-strong">
                        {displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEditNameModal(true)}
                        className="inline-flex items-center gap-1 p-1.5 rounded hover:bg-brand-bg-fill transition-colors text-brand-stroke-strong"
                        aria-label="Edit display name"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-brand-stroke-weak" />

                  {/* Email address */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-brand-text-strong">
                      Email address
                    </span>
                    <span className="text-sm text-brand-text-strong break-all" title={emailDisplay}>
                      {emailDisplay}
                    </span>
                  </div>

                  {/* Add another email - input */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-brand-text-strong">
                      Add another email address
                    </span>
                    <input
                      type="email"
                      value={addEmailValue}
                      onChange={(e) => setAddEmailValue(e.target.value)}
                      placeholder="Add email"
                      className="w-48 rounded-lg border border-brand-stroke-border px-3 py-2 text-sm text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Phone number + visibility - Only for Individual (job seeker) */}
                  {user?.accountType === "Individual" && (
                    <>
                      <div className="border-t border-brand-stroke-weak" />
                      <div className="flex items-center justify-between gap-4 py-2">
                        <span className="text-sm text-brand-text-strong">
                          Phone number
                        </span>
                        <input
                          type="tel"
                          value={phoneValue}
                          onChange={(e) => setPhoneValue(e.target.value)}
                          onBlur={async () => {
                            const trimmed = (phoneValue ?? "").trim().slice(0, 20);
                            if (trimmed === (user?.phone ?? "")) return;
                            setPhoneSaving(true);
                            try {
                              const res = await fetch("/api/profile", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "same-origin",
                                body: JSON.stringify({ phone: trimmed || null }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (data?.success && data.user) setUser((prev) => ({ ...prev, ...data.user }));
                            } finally {
                              setPhoneSaving(false);
                            }
                          }}
                          placeholder="Add phone"
                          className="w-48 rounded-lg border border-brand-stroke-border px-3 py-2 text-sm text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand"
                          disabled={phoneSaving}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 py-2">
                        <span className="text-sm text-brand-text-strong">
                          Show phone to recruiters and on gig popup
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={user?.phoneVisibleToRecruiters ?? false}
                          onClick={async () => {
                            const next = !(user?.phoneVisibleToRecruiters ?? false);
                            try {
                              const res = await fetch("/api/profile", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "same-origin",
                                body: JSON.stringify({ phoneVisibleToRecruiters: next }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (data?.success && data.user) setUser((prev) => ({ ...prev, ...data.user }));
                            } catch (_) {}
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                            user?.phoneVisibleToRecruiters ? "bg-brand" : "bg-brand-stroke-weak"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                              user?.phoneVisibleToRecruiters ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Location - Only for Individual/Gig Worker accounts (same as home; used for gigs too) */}
                  {user?.accountType === "Individual" && (
                    <>
                      <div className="border-t border-brand-stroke-weak" />
                      <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-brand-text-strong">
                            Location
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowEditHomeModal(true)}
                            className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                          >
                            Edit address
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {(() => {
                            // Priority 1: Home location
                            if (user?.homeLatitude != null && user?.homeLongitude != null) {
                              const parts = [];
                              if (user.homeLocality) parts.push(user.homeLocality);
                              if (user.homeDistrict) parts.push(user.homeDistrict);
                              if (user.homeState) parts.push(user.homeState);
                              return (
                                <>
                                  <span className="text-sm text-brand-text-strong">
                                    {parts.length > 0 ? parts.join(", ") : "Location set"}
                                  </span>
                                  <span className="text-xs text-brand-text-weak">
                                    Coordinates: {user.homeLatitude}, {user.homeLongitude}
                                  </span>
                                </>
                              );
                            }
                            // Priority 2: First gig location
                            if (firstGigForLocation) {
                              const parts = [];
                              if (firstGigForLocation.locality) parts.push(firstGigForLocation.locality);
                              if (firstGigForLocation.district) parts.push(firstGigForLocation.district);
                              if (firstGigForLocation.state) parts.push(firstGigForLocation.state);
                              if (firstGigForLocation.pincode) parts.push(`Pincode: ${firstGigForLocation.pincode}`);
                              return (
                                <>
                                  <span className="text-sm text-brand-text-strong">
                                    {parts.length > 0 ? parts.join(", ") : "Location set"}
                                  </span>
                                  {(firstGigForLocation.latitude || firstGigForLocation.longitude) && (
                                    <span className="text-xs text-brand-text-weak">
                                      Coordinates: {firstGigForLocation.latitude || "N/A"}, {firstGigForLocation.longitude || "N/A"}
                                    </span>
                                  )}
                                </>
                              );
                            }
                            // Empty state
                            return (
                              <span className="text-sm text-brand-text-weak">
                                No location set. Click Edit address to set your home location (used for gigs and map).
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Job Seeker Toggle - Only for Individual/Gig Worker accounts */}
                  {user?.accountType === "Individual" && (
                    <>
                      <div className="border-t border-brand-stroke-weak" />
                      <div className="flex items-center justify-between gap-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-text-strong">
                            Available for full-time positions
                          </p>
                          <p className="text-xs text-brand-text-weak mt-1">
                            Show your profile to companies looking for full-time employees
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.isJobSeeker || false}
                            onChange={async (e) => {
                              const newValue = e.target.checked;
                              try {
                                const res = await fetch("/api/profile/job-seeker-toggle", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ isJobSeeker: newValue }),
                                  credentials: "same-origin",
                                });
                                if (res.ok) {
                                  setUser((prev) => ({ ...prev, isJobSeeker: newValue }));
                                }
                              } catch (e) {
                                console.error("Failed to update job seeker status:", e);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              ) : activeSection === "company" ? (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-brand-text-strong">
                    Company Details
                  </h2>

                  {companyLoading ? (
                    <p className="text-brand-text-weak">Loading company details...</p>
                  ) : companies.length === 0 ? (
                    <p className="text-brand-text-weak">No company information found. Complete onboarding to add your company.</p>
                  ) : (
                    <>
                      {/* Company selector if multiple companies */}
                      {companies.length > 1 && (
                        <div className="flex items-center justify-between gap-4 py-2">
                          <span className="text-sm text-brand-text-strong">
                            Select Company
                          </span>
                          <select
                            value={selectedCompany?.id || ""}
                            onChange={(e) => {
                              const company = companies.find(c => c.id === parseInt(e.target.value));
                              setSelectedCompany(company);
                            }}
                            className="rounded-lg border border-brand-stroke-border px-3 py-2 text-sm text-brand-text-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                          >
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedCompany && (
                        <>
                          {/* Company logo */}
                          <div className="flex items-center justify-between gap-4 py-2">
<span className="text-sm text-brand-text-strong">
                            Company logo
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full overflow-hidden bg-brand-bg-fill flex items-center justify-center border border-brand-stroke-border shrink-0">
                                {selectedCompany.logoPath ? (
                                  <img
                                    src={selectedCompany.logoPath}
                                    alt="Company logo"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-medium text-brand-text-weak">
                                    {selectedCompany.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompanyLogoError(null);
                                  setShowCompanyLogoModal(true);
                                }}
                                className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                              >
                                Change logo
                              </button>
                            </div>
                          </div>
                          <div className="border-t border-brand-stroke-weak" />

                          {/* Company name */}
                          <div className="flex items-center justify-between gap-4 py-2">
                            <span className="text-sm text-brand-text-strong">
                              Company name
                            </span>
                            <span className="text-sm text-brand-text-strong">
                              {selectedCompany.name}
                            </span>
                          </div>
                          <div className="border-t border-brand-stroke-weak" />

                          {/* Location */}
                          <div className="py-2">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <span className="text-sm text-brand-text-strong">
                                Company Location
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowLocationEditModal(true)}
                                className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                              >
                                Edit
                              </button>
                            </div>
                            <div className="flex items-start gap-2 mt-2">
                              <Location size={16} className="mt-0.5 text-brand-text-weak" />
                              <div className="flex-1">
                                <div className="text-sm text-brand-text-strong">
                                  {selectedCompany.district}, {selectedCompany.state}
                                </div>
                                {(selectedCompany.latitude || selectedCompany.longitude) && (
                                  <div className="text-xs text-brand-text-weak mt-1">
                                    Coordinates: {selectedCompany.latitude}, {selectedCompany.longitude}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-brand-stroke-weak" />

                          {/* Website URL */}
                          {selectedCompany.websiteUrl && (
                            <>
                              <div className="flex items-center justify-between gap-4 py-2">
                                <span className="text-sm text-brand-text-strong">
                                  Website
                                </span>
                                <a
                                  href={selectedCompany.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-brand underline hover:opacity-80"
                                >
                                  {selectedCompany.websiteUrl}
                                </a>
                              </div>
                              <div className="border-t border-brand-stroke-weak" />
                            </>
                          )}

                          {/* Funding series */}
                          {selectedCompany.fundingSeries && (
                            <>
                              <div className="flex items-center justify-between gap-4 py-2">
                                <span className="text-sm text-brand-text-strong">
                                  Funding
                                </span>
                                <span className="text-sm text-brand-text-strong">
                                  {selectedCompany.fundingSeries}
                                </span>
                              </div>
                              <div className="border-t border-brand-stroke-weak" />
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : activeSection === "resume" ? (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-brand-text-strong">
                    My Resume
                  </h2>
                  <input
                    ref={resumeFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleResumeFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => resumeFileInputRef.current?.click()}
                    disabled={resumeUploading}
                    className="inline-flex flex-col items-center gap-1 text-brand underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                  >
                    <Document size={20} className="shrink-0" />
                    <span>Add</span>
                  </button>
                  {resume?.resumeFilePath && (
                    <p className="text-xs text-brand-text-weak">
                      Current file: {resume.resumeFilePath.split("/").pop()}
                    </p>
                  )}
                  {resumeLoading ? (
                    <p className="text-brand-text-weak">Loading resume…</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-brand-text-strong mb-1">First Name</label>
                          <input
                            value={resumeForm.firstName}
                            onChange={(e) => setResumeForm((f) => ({ ...f, firstName: handleTextInput(e.target.value) }))}
                            className={inputClass}
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-brand-text-strong mb-1">Last Name</label>
                          <input
                            value={resumeForm.lastName}
                            onChange={(e) => setResumeForm((f) => ({ ...f, lastName: handleTextInput(e.target.value) }))}
                            className={inputClass}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-brand-text-strong mb-1">Email</label>
                        <input
                          type="email"
                          value={resumeForm.emailOverride}
                          onChange={(e) => setResumeForm((f) => ({ ...f, emailOverride: e.target.value }))}
                          className={inputClass}
                          placeholder="Email (from auth or your own)"
                        />
                        <p className="text-xs text-brand-text-weak mt-1">Pre-filled from account; you can change it.</p>
                      </div>
                      <div>
                        <label className="block text-sm text-brand-text-strong mb-1">Current position</label>
                        <input
                          value={resumeForm.currentPosition}
                          onChange={(e) => setResumeForm((f) => ({ ...f, currentPosition: handleTextInput(e.target.value) }))}
                          className={inputClass}
                          placeholder="e.g. Software Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-brand-text-strong mb-1">Years of experience</label>
                        <input
                          value={resumeForm.yearsExperience}
                          onChange={(e) => setResumeForm((f) => ({ ...f, yearsExperience: handleNumericInput(e.target.value) }))}
                          className={inputClass}
                          placeholder="e.g. 5"
                        />
                      </div>
                      <div className="border-t border-brand-stroke-weak pt-4">
                        <p className="text-sm font-medium text-brand-text-strong mb-3">Current / previous company</p>
                        {resumeForm.workExperiences.map((w, idx) => (
                          <div key={idx} className="mb-4 p-3 rounded-lg border border-brand-stroke-weak space-y-2 relative">
                            <div className="flex items-center justify-between gap-2">
                              {idx > 0 && <p className="text-xs text-brand-text-weak">Previous company</p>}
                              <button
                                type="button"
                                onClick={() =>
                                  setResumeForm((f) => ({
                                    ...f,
                                    workExperiences: f.workExperiences.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="text-sm text-brand-text-weak hover:text-brand ml-auto"
                                aria-label="Remove company"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={w.companyName}
                              onChange={(e) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  workExperiences: f.workExperiences.map((x, i) =>
                                    i === idx ? { ...x, companyName: handleTextInput(e.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Company name"
                            />
                            <input
                              value={w.companyUrl}
                              onChange={(e) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  workExperiences: f.workExperiences.map((x, i) =>
                                    i === idx ? { ...x, companyUrl: e.target.value } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Company URL"
                            />
                            <input
                              value={w.position}
                              onChange={(e) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  workExperiences: f.workExperiences.map((x, i) =>
                                    i === idx ? { ...x, position: handleTextInput(e.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Your position"
                            />
                            <textarea
                              value={w.duties}
                              onChange={(e) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  workExperiences: f.workExperiences.map((x, i) =>
                                    i === idx ? { ...x, duties: handleTextInput(e.target.value) } : x
                                  ),
                                }))
                              }
                              className={`${inputClass} min-h-[60px]`}
                              placeholder="Duties"
                            />
                            <input
                              value={w.year}
                              onChange={(e) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  workExperiences: f.workExperiences.map((x, i) =>
                                    i === idx ? { ...x, year: handleNumericInput(e.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Year"
                            />
                          </div>
                        ))}
                        {resumeForm.workExperiences.length < 5 && (
                          <button
                            type="button"
                            onClick={() =>
                              setResumeForm((f) => ({
                                ...f,
                                workExperiences: [...f.workExperiences, { companyName: "", companyUrl: "", position: "", duties: "", year: "" }],
                              }))
                            }
                            className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                          >
                            Add previous company
                          </button>
                        )}
                      </div>
                      <div className="border-t border-brand-stroke-weak pt-4">
                        <p className="text-sm font-medium text-brand-text-strong mb-3">Education</p>
                        {resumeForm.educations.map((e, idx) => (
                          <div key={idx} className="mb-4 p-3 rounded-lg border border-brand-stroke-weak space-y-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setResumeForm((f) => ({
                                    ...f,
                                    educations: f.educations.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="text-sm text-brand-text-weak hover:text-brand"
                                aria-label="Remove education"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={e.universityName}
                              onChange={(ev) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  educations: f.educations.map((x, i) =>
                                    i === idx ? { ...x, universityName: handleTextInput(ev.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="University name"
                            />
                            <input
                              value={e.streamName}
                              onChange={(ev) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  educations: f.educations.map((x, i) =>
                                    i === idx ? { ...x, streamName: handleTextInput(ev.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Stream name"
                            />
                            <input
                              value={e.marksOrScore}
                              onChange={(ev) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  educations: f.educations.map((x, i) =>
                                    i === idx ? { ...x, marksOrScore: handleNumericInput(ev.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Marks / Score"
                            />
                            <input
                              value={e.yearOfPassing}
                              onChange={(ev) =>
                                setResumeForm((f) => ({
                                  ...f,
                                  educations: f.educations.map((x, i) =>
                                    i === idx ? { ...x, yearOfPassing: handleNumericInput(ev.target.value) } : x
                                  ),
                                }))
                              }
                              className={inputClass}
                              placeholder="Year of passing"
                            />
                          </div>
                        ))}
                        {resumeForm.educations.length < 5 && (
                          <button
                            type="button"
                            onClick={() =>
                              setResumeForm((f) => ({
                                ...f,
                                educations: [...f.educations, { universityName: "", streamName: "", marksOrScore: "", yearOfPassing: "" }],
                              }))
                            }
                            className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                          >
                            Add education
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-brand-text-strong mb-1">Expected salary package</label>
                          <input
                            value={resumeForm.expectedSalaryPackage}
                            onChange={(e) => setResumeForm((f) => ({ ...f, expectedSalaryPackage: e.target.value }))}
                            className={inputClass}
                            placeholder="e.g. 10 LPA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-brand-text-strong mb-1">Current salary package</label>
                          <div className="flex items-center gap-2">
                            <input
                              value={resumeForm.currentSalaryPackage}
                              onChange={(e) => setResumeForm((f) => ({ ...f, currentSalaryPackage: e.target.value }))}
                              className={`${inputClass} flex-1`}
                              placeholder="e.g. 8 LPA"
                            />
                            <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={resumeForm.currentSalaryVisibleToRecruiter}
                                onChange={(e) =>
                                  setResumeForm((f) => ({ ...f, currentSalaryVisibleToRecruiter: e.target.checked }))
                                }
                                className="rounded border-brand-stroke-strong"
                              />
                              <span className="text-xs text-brand-text-strong">Visible to recruiter</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      {/* Error message */}
                      {resumeError && (
                        <div className="mb-4 rounded-lg border border-brand-stroke-border bg-brand-bg-fill px-4 py-3">
                          <p className="text-sm text-brand-text-strong">{resumeError}</p>
                        </div>
                      )}
                      {/* Success message */}
                      {resumeSuccess && (
                        <div className="mb-4 rounded-lg border border-brand-stroke-border bg-brand-bg-fill px-4 py-3">
                          <p className="text-sm text-brand-text-strong">Resume saved successfully!</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={saveResume}
                          disabled={resumeSaving}
                          className="px-4 py-2 rounded-md bg-brand text-brand-bg-white hover:bg-brand-hover font-medium text-sm disabled:opacity-50"
                        >
                          {resumeSaving ? "Saving…" : "Save resume"}
                        </button>
                        {resume && (resume.firstName || resume.lastName || resume.currentPosition || resume.resumeFilePath || (resume.workExperiences && resume.workExperiences.length) || (resume.educations && resume.educations.length)) && (
                          <button
                            type="button"
                            onClick={() => setShowViewResumeModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-brand-stroke-border text-brand-text-strong hover:bg-brand-bg-fill text-sm font-medium transition-colors"
                          >
                            <Document size={16} className="shrink-0" />
                            View Resume
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : activeSection === "subscription" ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-brand-text-strong">Subscription or billing</h2>

                  <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg border border-brand-stroke-weak bg-brand-bg-white">
                    <div>
                      <p className="text-sm font-medium text-brand-text-strong">Current plan</p>
                      <p className="text-sm text-brand-text-weak mt-0.5">Status: Free</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(SUBSCRIPTION_PLANS[0]?.id ?? null);
                        setShowUpgradeModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-brand-bg-white hover:opacity-90 text-sm font-medium shrink-0"
                    >
                      Upgrade
                      <ArrowRight size={20} className="shrink-0" />
                    </button>
                  </div>

                  <div className="py-3 px-4 rounded-lg border border-brand-stroke-weak bg-brand-bg-white">
                    <p className="text-sm font-medium text-brand-text-strong">Status</p>
                    <p className="text-sm text-brand-text-weak mt-0.5">Free plan – upgrade for more features.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showViewResumeModal} onClose={() => setShowViewResumeModal(false)}>
        <div
          className="fixed left-1/2 top-1/2 z-[1003] flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg font-sans pt-6 pb-6 px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className="text-lg font-semibold text-brand-text-strong">Resume</h2>
            <button
              type="button"
              onClick={() => setShowViewResumeModal(false)}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={20} className="text-brand-stroke-strong" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 text-sm">
            {resume && (
              <>
                <div>
                  <p className="font-semibold text-brand-text-strong text-base">
                    {[resume.firstName, resume.lastName].filter(Boolean).join(" ") || "—"}
                  </p>
                  {resume.emailOverride && (
                    <p className="text-brand-text-weak mt-0.5">{resume.emailOverride}</p>
                  )}
                </div>
                {(resume.currentPosition || resume.yearsExperience) && (
                  <div className="border-t border-brand-stroke-weak pt-3">
                    {resume.currentPosition && (
                      <p className="text-brand-text-strong"><span className="font-medium">Position:</span> {resume.currentPosition}</p>
                    )}
                    {resume.yearsExperience && (
                      <p className="text-brand-text-weak mt-0.5"><span className="font-medium text-brand-text-strong">Experience:</span> {resume.yearsExperience} years</p>
                    )}
                  </div>
                )}
                {resume.workExperiences && resume.workExperiences.length > 0 && (
                  <div className="border-t border-brand-stroke-weak pt-3">
                    <p className="font-medium text-brand-text-strong mb-2">Work</p>
                    {resume.workExperiences.map((w, i) => (
                      <div key={i} className="mb-3 text-brand-text-weak">
                        <p className="font-medium text-brand-text-strong">{w.companyName || "Company"}{w.year ? ` (${w.year})` : ""}</p>
                        {w.position && <p>{w.position}</p>}
                        {w.duties && <p className="mt-0.5">{w.duties}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {resume.educations && resume.educations.length > 0 && (
                  <div className="border-t border-brand-stroke-weak pt-3">
                    <p className="font-medium text-brand-text-strong mb-2">Education</p>
                    {resume.educations.map((e, i) => (
                      <div key={i} className="mb-3 text-brand-text-weak">
                        <p className="font-medium text-brand-text-strong">{e.universityName || "—"}{e.yearOfPassing ? ` (${e.yearOfPassing})` : ""}</p>
                        {(e.streamName || e.marksOrScore) && <p>{[e.streamName, e.marksOrScore].filter(Boolean).join(" · ")}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {(resume.expectedSalaryPackage || resume.currentSalaryPackage) && (
                  <div className="border-t border-brand-stroke-weak pt-3">
                    {resume.expectedSalaryPackage && <p className="text-brand-text-weak"><span className="font-medium text-brand-text-strong">Expected salary:</span> {resume.expectedSalaryPackage}</p>}
                    {resume.currentSalaryVisibleToRecruiter && resume.currentSalaryPackage && (
                      <p className="text-brand-text-weak mt-0.5"><span className="font-medium text-brand-text-strong">Current salary:</span> {resume.currentSalaryPackage}</p>
                    )}
                  </div>
                )}
                {resume.resumeFilePath && (
                  <div className="border-t border-brand-stroke-weak pt-3">
                    <p className="text-brand-text-weak"><span className="font-medium text-brand-text-strong">Attached file:</span> {resume.resumeFilePath.split("/").pop()}</p>
                  </div>
                )}
          </>
            )}
          </div>
          <div className="flex shrink-0 gap-2 pt-4 border-t border-brand-stroke-weak mt-4">
            <button
              type="button"
              onClick={() => { setShowViewResumeModal(false); }}
              className="px-4 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill text-sm font-medium"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => { setShowViewResumeModal(false); }}
              className="px-4 py-2 rounded-md bg-brand text-brand-bg-white hover:bg-brand-hover font-medium text-sm"
            >
              Edit resume
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUpgradeModal} onClose={() => { setShowUpgradeModal(false); setSelectedPlanId(null); }}>
        <div
          className="fixed left-1/2 top-1/2 z-[1003] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg font-sans pt-6 pb-6 px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className="text-lg font-semibold text-brand-text-strong">Go further with mapmyGig</h2>
            <button
              type="button"
              onClick={() => { setShowUpgradeModal(false); setSelectedPlanId(null); }}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={20} className="text-brand-stroke-strong" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`flex flex-col text-left p-4 rounded-lg border-[1.5px] transition-colors ${
                      isSelected ? "border-brand bg-brand/5" : "border-brand-stroke-weak hover:bg-brand-bg-fill"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-brand-text-strong">{plan.name}</h3>
                        <p className="text-xs text-brand-text-weak mt-0.5">{plan.subheading}</p>
                      </div>
                      {plan.badge && (
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-md bg-brand/10 text-brand">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-brand-text-strong">₹{plan.price}</span>
                      <span className="text-sm text-brand-text-weak">{plan.priceLabel}</span>
                    </div>
                    <p className="text-xs text-brand-text-weak mt-0.5">Billed yearly</p>
                    <div className="mt-3 flex justify-end text-brand-stroke-strong" aria-hidden>
                      <Receipt size={32} className="opacity-60" />
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-brand-text-weak">
                          <Checkmark size={16} className="shrink-0 text-brand" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            {selectedPlanId && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId);
                    if (SUBSCRIPTION_CHECKOUT_URL) {
                      const url = `${SUBSCRIPTION_CHECKOUT_URL}${SUBSCRIPTION_CHECKOUT_URL.includes("?") ? "&" : "?"}plan=${selectedPlanId}`;
                      window.location.href = url;
                    } else {
                      alert(`Checkout for ${plan?.name ?? selectedPlanId} will open here. Set NEXT_PUBLIC_SUBSCRIPTION_CHECKOUT_URL for Razorpay.`);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-brand text-brand-bg-white hover:opacity-90 font-medium text-sm"
                >
                  {(() => {
                    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId);
                    return plan ? `Continue with ${plan.name}` : "Continue";
                  })()}
                  <ArrowRight size={20} className="shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <EditDisplayNameModal
        isOpen={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
        currentName={displayNameForEdit}
        onSaved={handleSavedName}
      />

      <Modal isOpen={showAvatarModal} onClose={() => !avatarSaving && !avatarUploading && setShowAvatarModal(false)}>
        <div
          className="fixed left-1/2 top-1/2 z-[1003] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className="text-lg font-semibold text-brand-text-strong">
              Change photo
            </h2>
            <button
              type="button"
              onClick={() => {
                if (!avatarSaving && !avatarUploading) {
                  setAvatarError(null);
                  setShowAvatarModal(false);
                }
              }}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={20} className="text-brand-stroke-strong" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled={avatarSaving || avatarUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-full border-2 border-dashed border-brand-stroke-border hover:border-brand hover:bg-brand-bg-fill flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
              title="Upload photo from device"
              aria-label="Upload photo from device"
            >
              <Add size={28} className="text-brand-stroke-strong" />
            </button>
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                disabled={avatarSaving || avatarUploading}
                onClick={() => handleSelectAvatar(avatar)}
                className="w-full aspect-square rounded-full overflow-hidden border-2 border-brand-stroke-border hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
              >
                <img
                  src={avatar.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {(avatarSaving || avatarUploading) && (
            <p className="mt-4 text-sm text-brand-text-weak">
              {avatarUploading ? "Uploading…" : "Saving…"}
            </p>
          )}
          {avatarError && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {avatarError}
            </p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showCompanyLogoModal} onClose={() => !companyLogoUploading && setShowCompanyLogoModal(false)}>
        <div
          className="fixed left-1/2 top-1/2 z-[1003] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className="text-lg font-semibold text-brand-text-strong">
              Change company logo
            </h2>
            <button
              type="button"
              onClick={() => {
                if (!companyLogoUploading) {
                  setCompanyLogoError(null);
                  setShowCompanyLogoModal(false);
                }
              }}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={20} className="text-brand-stroke-strong" />
            </button>
          </div>
          <input
            ref={companyLogoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCompanyLogoInputChange}
          />
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={companyLogoUploading}
              onClick={() => companyLogoInputRef.current?.click()}
              className="w-full py-3 rounded-lg border-2 border-dashed border-brand-stroke-border hover:border-brand hover:bg-brand-bg-fill flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
              title="Upload logo from device"
              aria-label="Upload logo from device"
            >
              <Add size={24} className="text-brand-stroke-strong" />
              <span className="text-sm font-medium text-brand-text-strong">
                Upload company logo
              </span>
            </button>
            <p className="text-xs text-center text-brand-text-weak">
              Only image upload is supported for company logos
            </p>
          </div>
          {companyLogoUploading && (
            <p className="mt-4 text-sm text-brand-text-weak">
              Uploading...
            </p>
          )}
          {companyLogoError && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {companyLogoError}
            </p>
          )}
        </div>
      </Modal>

      <EditCompanyLocationModal
        isOpen={showLocationEditModal}
        onClose={() => setShowLocationEditModal(false)}
        company={selectedCompany}
        onLocationUpdated={(updatedCompany) => {
          setSelectedCompany(updatedCompany);
          setCompanies((prev) =>
            prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
          );
        }}
      />

      <AddHomeModal
        isOpen={showEditHomeModal}
        onClose={() => setShowEditHomeModal(false)}
        initialHome={
          user?.homeLatitude != null && user?.homeLongitude != null
            ? {
                homeLatitude: user.homeLatitude,
                homeLongitude: user.homeLongitude,
                homeLocality: user.homeLocality,
                homeDistrict: user.homeDistrict,
                homeState: user.homeState,
              }
            : null
        }
        onSaved={(updatedUser) => {
          if (updatedUser) setUser((prev) => ({ ...prev, ...updatedUser }));
          setShowEditHomeModal(false);
          fetch("/api/auth/me", { credentials: "same-origin" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.success && data.user) setUser(data.user);
            })
            .catch(() => {});
        }}
      />
    </>
  );
}
