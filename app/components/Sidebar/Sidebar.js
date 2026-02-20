"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import themeClasses from "../../theme-utility-classes.json";
import {
  Document,
  Archive,
  OpenPanelLeft,
  SidePanelOpen,
  Add,
  Bullhorn,
  EarthFilled,
  Settings,
} from "@carbon/icons-react";
import Tooltip from "../Tooltip";

export default function Sidebar({ activeItem = "jobs-near-you", onToggle, isOpen: externalIsOpen, onOpenSettingsWithSection, viewMode = "person" }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(externalIsOpen !== undefined ? externalIsOpen : true);

  const sidebar = themeClasses.components.sidebar;
  const brand = themeClasses.brand;

  // Sync with external control
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Handle toggle
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  // Navigation items: 1 Gigs/Candidates near you, 2 Post a gig/job, 3 Manage Resume, 4 Manage JDs, 5 Settings
  const jobsNearYouLabel = viewMode === "person" ? "Candidates near you" : "Candidates near you";
  const postGigLabel = viewMode === "person" ? "Post a gig" : "Post a job";
  const navigationItems = [
    { id: "jobs-near-you", label: jobsNearYouLabel, icon: EarthFilled, route: "/jobs-near-you" },
    { id: "post-gig", label: postGigLabel, icon: Add, route: "/onboarding" },
    { id: "manage-resume", label: "Manage Resume", icon: Document, route: "/manage-resume", openSettingsSection: "resume" },
    { id: "manage-jds", label: "Manage JDs", icon: Archive, route: "/manage-jds" },
    { id: "settings", label: "Settings", icon: Settings, route: "/", openSettingsSection: "general" },
  ];

  const isDev = process.env.NODE_ENV !== "production";

  const handleNavigation = (item) => {
    if (item.openSettingsSection && typeof onOpenSettingsWithSection === "function") {
      onOpenSettingsWithSection(item.openSettingsSection);
      return;
    }
    router.push(item.route);
  };

  return (
    <aside
      className={`h-screen flex flex-col bg-white overflow-x-hidden min-w-0 ${
        isOpen ? sidebar["container-expanded"] : sidebar["container-collapsed"]
      }`}
    >
      {/* Logo & Toggle Section - small logo; right icon (OpenPanelLeft) when panel open */}
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
              className={`${sidebar["toggle-button"]} w-full flex items-center justify-center rounded-lg bg-transparent hover:bg-brand-stroke-weak`}
              aria-label="Open sidebar"
            >
              <SidePanelOpen size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
            </button>
          )}

          {isOpen && (
            <button
              onClick={handleToggle}
              className={sidebar["toggle-button"]}
              aria-label="Close sidebar"
            >
              <OpenPanelLeft size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 ${sidebar["nav-container"]}`}>
        <ul className="space-y-2 min-w-0 w-full">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.id;
            const isComingSoon = !isDev && item.id !== "jobs-near-you" && item.id !== "post-gig" && item.id !== "manage-resume" && item.id !== "settings";
            const isDisabled = isComingSoon || (!isActive && item.id !== "jobs-near-you" && item.id !== "post-gig" && item.id !== "manage-resume" && item.id !== "settings");
            const tooltipContent = !isOpen ? (isComingSoon ? "Coming soon" : item.label) : "";
            return (
              <li key={item.id} className="w-full">
                <Tooltip content={tooltipContent} as="span" className={!isOpen ? "block w-full" : "block w-full"}>
                  <button
                    onClick={() => !isDisabled && handleNavigation(item)}
                    disabled={isDisabled}
                    aria-label={item.label}
                    className={`${sidebar["nav-button"]} w-full ${!isOpen ? "w-full" : "w-full"} ${
                      isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
                    } ${isActive ? sidebar["nav-button-active"] : "hover:bg-brand-bg-fill"} ${
                      isDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className={sidebar["nav-icon-container"]}>
                      <IconComponent
                        size={24}
                        style={{ color: "rgba(87, 87, 87, 1)" }}
                      />
                    </div>
                    {isOpen && (
                      <span className={`${sidebar["nav-text"]} min-w-0 truncate`}>{item.label}</span>
                    )}
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* What's New Section */}
      <div className="p-2 pt-1 pb-1">
        <Tooltip
          content={!isOpen ? (isDev ? "What's New" : "Coming soon") : ""}
          as="span"
          className="block w-full"
        >
          <button
            onClick={isDev ? () => handleNavigation({ route: "/roadmap" }) : undefined}
            disabled={!isDev}
            aria-label="What's New"
            className={`${sidebar["nav-button"]} w-full ${
              isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
            } hover:bg-brand-bg-fill ${!isDev ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className={sidebar["nav-icon-container"]}>
              <Bullhorn size={24} style={{ color: "rgba(87, 87, 87, 1)" }} />
            </div>
            {isOpen && <span className={`${sidebar["nav-text"]} min-w-0 truncate`}>What's New</span>}
          </button>
        </Tooltip>
      </div>

    </aside>
  );
}
