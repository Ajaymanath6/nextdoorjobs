"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import themeClasses from "../../theme-utility-classes.json";
import {
  OpenPanelLeft,
  SidePanelOpen,
  TaskAdd,
} from "@carbon/icons-react";
import Tooltip from "../Tooltip";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";

const SIDEBAR_ICONS = {
  home: "/icons/sidebar/home.png",
  map: "/icons/sidebar/map.png",
  notifications: "/icons/sidebar/notifications.png",
  settings: "/icons/sidebar/settings.png",
  speaker: "/icons/sidebar/speaker.png",
  myJobs: "/icons/sidebar/my-jobs.png",
};

function SidebarNavIcon({ item }) {
  if (item.iconSrc) {
    return (
      <span className="w-6 h-6 flex items-center justify-center shrink-0 bg-[#FFF4F1] dark:bg-black rounded-sm overflow-hidden">
        <Image
          src={item.iconSrc}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 object-contain"
          unoptimized
        />
      </span>
    );
  }
  const IconComponent = item.icon;
  return (
    <span className="w-6 h-6 flex items-center justify-center shrink-0 bg-[#FFF4F1] dark:bg-black rounded-sm">
      <IconComponent size={24} style={{ color: "rgba(87, 87, 87, 1)" }} />
    </span>
  );
}

export default function Sidebar({
  activeItem = "home",
  onToggle,
  isOpen: externalIsOpen,
  onOpenSettingsWithSection,
  viewMode = "person",
  effectiveUser = null,
  effectiveUserLoading = true,
  onRequestGig,
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(externalIsOpen !== undefined ? externalIsOpen : true);
  const [accountTypeFromAuth, setAccountTypeFromAuth] = useState(null);
  const { count: notificationCount } = useUnreadNotificationCount();

  const sidebar = themeClasses.components.sidebar;

  const accountType = effectiveUser?.accountType ?? accountTypeFromAuth;

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      queueMicrotask(() => setIsOpen(externalIsOpen));
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (effectiveUser != null) return;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.user?.accountType) setAccountTypeFromAuth(data.user.accountType);
      })
      .catch(() => {});
  }, [effectiveUser]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const jobsNearYouLabel =
    accountType === "Company"
      ? "Candidates near you"
      : viewMode === "company"
        ? "Jobs near you"
        : "Gigs near you";

  const HIDE_REQUEST_GIG = true;
  const navigationItems = [
    { id: "home", label: "Home", iconSrc: SIDEBAR_ICONS.home, route: "/" },
    {
      id: "jobs-near-you",
      label: jobsNearYouLabel,
      iconSrc: SIDEBAR_ICONS.map,
      route: "/jobs-near-you",
    },
    {
      id: "notifications",
      label: "Notifications",
      iconSrc: SIDEBAR_ICONS.notifications,
      route: "/notifications",
      badge: true,
    },
    ...(!HIDE_REQUEST_GIG && accountType === "Individual" && typeof onRequestGig === "function"
      ? [{ id: "request-gig", label: "Request a gig", icon: TaskAdd, onRequestGigAction: true }]
      : []),
    { id: "manage-jds", label: "My jobs", iconSrc: SIDEBAR_ICONS.myJobs, route: "/my-jobs" },
    {
      id: "settings",
      label: "Settings",
      iconSrc: SIDEBAR_ICONS.settings,
      route: "/",
      openSettingsSection: "general",
    },
  ];

  const isDev = process.env.NODE_ENV !== "production";

  const handleNavigation = (item) => {
    if (item.onRequestGigAction && typeof onRequestGig === "function") {
      onRequestGig();
      return;
    }
    if (item.openSettingsSection && typeof onOpenSettingsWithSection === "function") {
      onOpenSettingsWithSection(item.openSettingsSection);
      return;
    }
    router.push(item.route);
  };

  const renderNavButton = (item, options = {}) => {
    const { bottom = false } = options;
    const isActive = activeItem === item.id;
    const enabledIdsProdForCompany = [
      "home",
      "jobs-near-you",
      "notifications",
      "manage-jds",
      "settings",
    ];
    const enabledIdsProdForIndividual = [
      "home",
      "jobs-near-you",
      "notifications",
      "request-gig",
      "manage-jds",
      "settings",
    ];
    const enabledIds = accountType === "Company" ? enabledIdsProdForCompany : enabledIdsProdForIndividual;
    const isComingSoon = !isDev && !enabledIds.includes(item.id) && !bottom;
    const isDisabled =
      options.disabled ?? (isComingSoon || (!isActive && !isDev && !enabledIds.includes(item.id) && !bottom));
    const tooltipContent = !isOpen ? (isComingSoon ? "Coming soon" : item.label) : "";

    return (
      <Tooltip
        content={tooltipContent}
        placement={!isOpen ? "right" : "bottom"}
        as="span"
        className="block w-full"
      >
        <button
          onClick={() => !isDisabled && handleNavigation(item)}
          disabled={isDisabled}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          className={`${sidebar["nav-button"]} w-full ${
            isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
          } ${isActive ? sidebar["nav-button-active"] : sidebar["nav-button-hover"]} ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-r-sm"
              aria-hidden
            />
          )}
          <div className={`${sidebar["nav-icon-container"]} relative`}>
            <SidebarNavIcon item={item} />
            {!isOpen && item.badge && notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                style={{ fontSize: "10px" }}
              >
                {notificationCount}
              </span>
            )}
          </div>
          {isOpen && <span className={`${sidebar["nav-text"]} min-w-0 truncate`}>{item.label}</span>}
          {isOpen && item.badge && notificationCount > 0 && (
            <span
              className="ml-auto bg-brand text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5"
              style={{ fontSize: "10px" }}
            >
              {notificationCount}
            </span>
          )}
        </button>
      </Tooltip>
    );
  };

  return (
    <aside
      className={`h-screen flex flex-col bg-[#FFF4F1] dark:bg-black min-w-0 ${
        isOpen ? sidebar["container-expanded"] : sidebar["container-collapsed"]
      } ${isOpen ? "overflow-x-hidden" : "overflow-visible"}`}
    >
      <div className={`${sidebar["logo-section"]} relative min-w-0 shrink-0`}>
        <div className="flex items-center justify-between min-w-0">
          {isOpen ? (
            <div className="flex items-center min-w-0">
              <div className="h-6 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.svg"
                  alt="mapmyGig"
                  width={96}
                  height={24}
                  className="h-6 w-auto"
                  style={{ width: "auto", height: "1.5rem" }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleToggle}
              className={`${sidebar["toggle-button"]} w-full flex items-center justify-center rounded-lg bg-transparent hover:bg-brand-bg-fill`}
              aria-label="Open sidebar"
            >
              <SidePanelOpen size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
            </button>
          )}

          {isOpen && (
            <button onClick={handleToggle} className={sidebar["toggle-button"]} aria-label="Close sidebar">
              <OpenPanelLeft size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 min-h-0 min-w-0 ${sidebar["nav-container"]} ${
          isOpen ? "overflow-y-auto overflow-x-hidden" : "overflow-visible"
        }`}
      >
        <ul className="space-y-2 min-w-0 w-full">
          {navigationItems.map((item) => (
            <li key={item.id} className="w-full">
              {renderNavButton(item)}
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 p-2 pt-1 pb-1">
        {renderNavButton(
          {
            id: "whats-new",
            label: "What's New",
            iconSrc: SIDEBAR_ICONS.speaker,
            route: "/roadmap",
          },
          { bottom: true, disabled: !isDev }
        )}
      </div>
    </aside>
  );
}
