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
} from "@carbon/icons-react";

export default function Sidebar({ activeItem = "jobs-near-you", onToggle, isOpen: externalIsOpen, onOpenSettingsWithSection }) {
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

  // Navigation items (Home and Get Vetted removed)
  const navigationItems = [
    { id: "manage-resume", label: "Manage Resume", icon: Document, route: "/manage-resume", openSettingsSection: "resume" },
    { id: "manage-jds", label: "Manage JDs", icon: Archive, route: "/manage-jds" },
    { id: "jobs-near-you", label: "Jobs Near You", icon: EarthFilled, route: "/jobs-near-you" },
    { id: "post-gig", label: "Post a gig", icon: Add, route: "/onboarding" },
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
      className={`h-screen flex flex-col bg-white ${
        isOpen ? sidebar["container-expanded"] : sidebar["container-collapsed"]
      }`}
    >
      {/* Logo & Toggle Section - small logo; right icon (OpenPanelLeft) when panel open */}
      <div className={`${sidebar["logo-section"]} relative`}>
        <div className="flex items-center justify-between">
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
      <nav className={`flex-1 overflow-y-auto ${sidebar["nav-container"]}`}>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.id;
            const isComingSoon = !isDev && item.id !== "jobs-near-you" && item.id !== "post-gig" && item.id !== "manage-resume";
            const isDisabled = isComingSoon || (!isActive && item.id !== "jobs-near-you" && item.id !== "post-gig" && item.id !== "manage-resume");
            return (
              <li key={item.id}>
                <button
                  onClick={() => !isDisabled && handleNavigation(item)}
                  disabled={isDisabled}
                  title={isComingSoon ? "Coming soon" : undefined}
                  className={`${sidebar["nav-button"]} ${
                    isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
                  } ${isActive ? sidebar["nav-button-active"] : sidebar["nav-button-hover"]} ${
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
                    <span className={sidebar["nav-text"]}>{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* What's New Section */}
      <div className="p-2 pt-1 pb-1">
        <button
          onClick={isDev ? () => handleNavigation("/roadmap") : undefined}
          disabled={!isDev}
          title={isDev ? "What's New" : "Coming soon"}
          className={`${sidebar["nav-button"]} ${
            isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
          } ${sidebar["nav-button-hover"]} ${!isDev ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className={sidebar["nav-icon-container"]}>
            <Bullhorn
              size={24}
              style={{ color: "rgba(87, 87, 87, 1)" }}
            />
          </div>
          {isOpen && <span className={sidebar["nav-text"]}>What's New</span>}
        </button>
      </div>

    </aside>
  );
}
