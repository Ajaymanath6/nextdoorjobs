"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import {
  Close,
  Settings,
  Receipt,
  DataConnected,
  SettingsAdjust,
  Edit,
} from "@carbon/icons-react";
import EditDisplayNameModal from "./EditDisplayNameModal";
import themeClasses from "../theme-utility-classes.json";
import { AVATARS } from "../../lib/avatars";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings },
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
  const [avatarError, setAvatarError] = useState(null);
  const [addEmailValue, setAddEmailValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

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
                {SECTIONS.map(({ id, label, icon: Icon, disabled }) => (
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
                  <h2 className={`text-base font-semibold ${brand.text.strong}`}>
                    My Account
                  </h2>

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
                        className="text-sm font-medium text-brand-stroke-strong hover:text-brand underline underline-offset-2"
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

      <Modal isOpen={showAvatarModal} onClose={() => !avatarSaving && setShowAvatarModal(false)}>
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
                if (!avatarSaving) {
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
          <div className="grid grid-cols-3 gap-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                disabled={avatarSaving}
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
          {avatarSaving && (
            <p className={`mt-4 text-sm ${brand.text.weak}`}>Saving…</p>
          )}
          {avatarError && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {avatarError}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
