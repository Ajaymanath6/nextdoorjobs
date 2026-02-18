"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@carbon/icons-react";
import EditDisplayNameModal from "./EditDisplayNameModal";
import EditCompanyLocationModal from "./EditCompanyLocationModal";
import themeClasses from "../theme-utility-classes.json";
import { AVATARS } from "../../lib/avatars";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings },
  { id: "company", label: "Company Details", icon: Receipt },
  { id: "subscription", label: "Subscription", icon: Receipt },
  { id: "integration", label: "Integration", icon: DataConnected, disabled: true },
  { id: "other", label: "Other", icon: SettingsAdjust, disabled: true },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState("general");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [addEmailValue, setAddEmailValue] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [showCompanyLogoModal, setShowCompanyLogoModal] = useState(false);
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);
  const [companyLogoError, setCompanyLogoError] = useState(null);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const fileInputRef = useRef(null);
  const companyLogoInputRef = useRef(null);

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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div
          className="fixed left-1/2 top-1/2 z-[1002] flex h-[85vh] max-h-[85vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
          style={{ fontFamily: "Open Sans, sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-brand-stroke-weak py-4">
            <h1 className={`text-xl font-semibold ${brand.text.strong}`}>
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
                  // Only show company section for Company accounts
                  if (section.id === "company") {
                    return user?.accountType === "Company";
                  }
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
                            ? `bg-brand/10 ${brand.text.strong} font-medium`
                            : `text-brand-text-weak hover:bg-brand-bg-fill ${brand.text.strong}`
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
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              {loading ? (
                <p className={brand.text.weak}>Loading…</p>
              ) : activeSection === "general" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-base font-semibold ${brand.text.strong}`}>
                      My Account
                    </h2>
                    {user?.accountType && user.accountType.trim() !== "" && (
                      <span className="text-xs font-medium" style={{ color: "#F84416" }}>
                        {user.accountType === "Individual" ? "Gig/Jobseeker" : user.accountType}
                      </span>
                    )}
                  </div>

                  {/* Profile picture - label left, avatar + Change photo right */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className={`text-sm ${brand.text.strong}`}>
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
                          <span className={`text-lg font-medium ${brand.text.weak}`}>
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
                        style={{ color: brand.color || "#F84416" }}
                      >
                        Change photo
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-brand-stroke-weak" />

                  {/* Display name */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className={`text-sm ${brand.text.strong}`}>
                      Display name
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${brand.text.strong}`}>
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
                    <span className={`text-sm ${brand.text.strong}`}>
                      Email address
                    </span>
                    <span className={`text-sm ${brand.text.strong} break-all`} title={emailDisplay}>
                      {emailDisplay}
                    </span>
                  </div>

                  {/* Add another email - input */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className={`text-sm ${brand.text.strong}`}>
                      Add another email address
                    </span>
                    <input
                      type="email"
                      value={addEmailValue}
                      onChange={(e) => setAddEmailValue(e.target.value)}
                      placeholder="Add email"
                      className="w-48 rounded-lg border border-brand-stroke-border px-3 py-2 text-sm text-brand-text-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>

                  {/* Job Seeker Toggle - Only for Individual/Gig Worker accounts */}
                  {user?.accountType === "Individual" && (
                    <>
                      <div className="border-t border-brand-stroke-weak" />
                      <div className="flex items-center justify-between gap-4 py-3">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${brand.text.strong}`}>
                            Available for full-time positions
                          </p>
                          <p className={`text-xs ${brand.text.weak} mt-1`}>
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
                  <h2 className={`text-base font-semibold ${brand.text.strong}`}>
                    Company Details
                  </h2>

                  {companyLoading ? (
                    <p className={brand.text.weak}>Loading company details...</p>
                  ) : companies.length === 0 ? (
                    <p className={brand.text.weak}>No company information found. Complete onboarding to add your company.</p>
                  ) : (
                    <>
                      {/* Company selector if multiple companies */}
                      {companies.length > 1 && (
                        <div className="flex items-center justify-between gap-4 py-2">
                          <span className={`text-sm ${brand.text.strong}`}>
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
                            <span className={`text-sm ${brand.text.strong}`}>
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
                                  <span className={`text-lg font-medium ${brand.text.weak}`}>
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
                                style={{ color: brand.color || "#F84416" }}
                              >
                                Change logo
                              </button>
                            </div>
                          </div>
                          <div className="border-t border-brand-stroke-weak" />

                          {/* Company name */}
                          <div className="flex items-center justify-between gap-4 py-2">
                            <span className={`text-sm ${brand.text.strong}`}>
                              Company name
                            </span>
                            <span className={`text-sm ${brand.text.strong}`}>
                              {selectedCompany.name}
                            </span>
                          </div>
                          <div className="border-t border-brand-stroke-weak" />

                          {/* Location */}
                          <div className="py-2">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <span className={`text-sm ${brand.text.strong}`}>
                                Company Location
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowLocationEditModal(true)}
                                className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
                                style={{ color: brand.color || "#F84416" }}
                              >
                                Edit
                              </button>
                            </div>
                            <div className="flex items-start gap-2 mt-2">
                              <Location size={16} className={`mt-0.5 ${brand.text.weak}`} />
                              <div className="flex-1">
                                <div className={`text-sm ${brand.text.strong}`}>
                                  {selectedCompany.district}, {selectedCompany.state}
                                </div>
                                {(selectedCompany.latitude || selectedCompany.longitude) && (
                                  <div className={`text-xs ${brand.text.weak} mt-1`}>
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
                                <span className={`text-sm ${brand.text.strong}`}>
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
                                <span className={`text-sm ${brand.text.strong}`}>
                                  Funding
                                </span>
                                <span className={`text-sm ${brand.text.strong}`}>
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
              ) : activeSection === "subscription" ? (
                <p className={brand.text.weak}>Subscription settings (placeholder).</p>
              ) : null}
            </div>
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
          className="fixed left-1/2 top-1/2 z-[1003] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
          style={{ fontFamily: "Open Sans, sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className={`text-lg font-semibold ${brand.text.strong}`}>
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
            <p className={`mt-4 text-sm ${brand.text.weak}`}>
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
          className="fixed left-1/2 top-1/2 z-[1003] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
          style={{ fontFamily: "Open Sans, sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-brand-stroke-weak pb-4 mb-4">
            <h2 className={`text-lg font-semibold ${brand.text.strong}`}>
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
              <span className={`text-sm font-medium ${brand.text.strong}`}>
                Upload company logo
              </span>
            </button>
            <p className={`text-xs text-center ${brand.text.weak}`}>
              Only image upload is supported for company logos
            </p>
          </div>
          {companyLogoUploading && (
            <p className={`mt-4 text-sm ${brand.text.weak}`}>
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
    </>
  );
}
