"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar/Sidebar";
import SettingsModal from "./SettingsModal";
import RequestGigModal from "./RequestGigModal";

export default function AppShell({
  activeItem,
  children,
  viewMode,
  onViewModeChange,
}) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRequestGigModal, setShowRequestGigModal] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const [internalViewMode, setInternalViewMode] = useState("person");
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [effectiveUserLoading, setEffectiveUserLoading] = useState(true);
  const [isAdminViewAs, setIsAdminViewAs] = useState(false);

  const resolvedViewMode = viewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authRes = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (cancelled) return;
      if (authRes.ok) {
        const data = await authRes.json().catch(() => ({}));
        if (data?.success && data?.user) {
          setEffectiveUser(data.user);
          setEffectiveUserLoading(false);
          return;
        }
      }
      const adminRes = await fetch("/api/admin/me", { credentials: "same-origin" });
      if (cancelled) return;
      if (!adminRes.ok) {
        setEffectiveUserLoading(false);
        return;
      }
      const viewAsRes = await fetch("/api/admin/view-as-user", { credentials: "same-origin" });
      if (cancelled) return;
      if (viewAsRes.ok) {
        const viewData = await viewAsRes.json().catch(() => ({}));
        if (viewData?.success && viewData?.user) {
          setEffectiveUser(viewData.user);
          setIsAdminViewAs(true);
        }
      }
      setEffectiveUserLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenSettings = (section = null) => {
    setSettingsInitialSection(section ?? null);
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    setSettingsInitialSection(null);
  };

  const handleExitAdminViewAs = async () => {
    await fetch("/api/admin/clear-view-as", { method: "POST", credentials: "include" });
    window.location.href = "/admin";
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {isAdminViewAs && effectiveUser && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-brand text-brand-bg-white text-sm">
          <span>
            Viewing as {effectiveUser.accountType === "Company" ? "Company" : "Gig worker"}
          </span>
          <button
            type="button"
            onClick={handleExitAdminViewAs}
            className="rounded-md bg-brand-bg-white text-brand-text-strong px-3 py-1.5 text-sm font-medium hover:bg-brand-bg-fill"
          >
            Exit to Admin
          </button>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <div className="hidden md:flex shrink-0 relative z-20 overflow-visible">
          <Sidebar
            activeItem={activeItem}
            onOpenSettingsWithSection={handleOpenSettings}
            viewMode={resolvedViewMode}
            effectiveUser={effectiveUser}
            effectiveUserLoading={effectiveUserLoading}
            onRequestGig={() => setShowRequestGigModal(true)}
          />
        </div>

        <div className="flex-1 min-h-0 min-w-0 mt-4 md:mt-8 mr-4 mb-4 rounded-[16px] overflow-hidden relative">
          {typeof children === "function"
            ? children({
                effectiveUser,
                effectiveUserLoading,
                setViewMode,
                onOpenSettings: handleOpenSettings,
              })
            : children}
        </div>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
        initialSection={settingsInitialSection}
      />
      <RequestGigModal
        isOpen={showRequestGigModal}
        onClose={() => setShowRequestGigModal(false)}
      />
    </div>
  );
}
