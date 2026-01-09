"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import themeClasses from "../../theme-utility-classes.json";
import JobMapIcon from "../JobMapIcon";
import {
  Home,
  Document,
  Archive,
  SidePanelClose,
  SidePanelOpen,
  User,
  Logout,
  ThumbsUpDouble,
  Settings,
  Bullhorn,
  UserAvatar,
  EarthFilled,
  IbmLpa,
} from "@carbon/icons-react";

export default function Sidebar({ activeItem = "jobs-near-you", onToggle, isOpen: externalIsOpen }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(externalIsOpen !== undefined ? externalIsOpen : true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoHover, setShowLogoHover] = useState(false);
  const userDropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Navigation items
  const navigationItems = [
    { id: "home", label: "Home", icon: Home, route: "/" },
    { id: "get-vetted", label: "Get Vetted", icon: ThumbsUpDouble, route: "/get-vetted" },
    { id: "manage-resume", label: "Manage Resume", icon: Document, route: "/manage-resume" },
    { id: "manage-jds", label: "Manage JDs", icon: Archive, route: "/manage-jds" },
    { id: "jobs-near-you", label: "Jobs Near You", icon: EarthFilled, route: "/jobs-near-you" },
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  const handleUserClick = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  return (
    <aside
      className={`h-screen flex flex-col ${
        isOpen ? sidebar["container-expanded"] : sidebar["container-collapsed"]
      }`}
    >
      {/* Logo & Toggle Section */}
      <div className={`${sidebar["logo-section"]} relative`}>
        <div className="flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <div className={sidebar["logo-container"]}>
                <div className={`w-6 h-6 ${brand.color.primary} rounded flex items-center justify-center`}>
                  <JobMapIcon size={18} className="text-white" />
                </div>
              </div>
              <h2 className={sidebar["logo-text"]}>NextDoorJobs</h2>
            </div>
          ) : (
            <div
              className="flex items-center justify-center cursor-pointer rounded-lg p-1 hover:bg-brand-stroke-weak transition-colors relative"
              onMouseEnter={() => setShowLogoHover(true)}
              onMouseLeave={() => setShowLogoHover(false)}
              onClick={handleToggle}
            >
              <div className={sidebar["logo-container"]}>
                <div className={`w-6 h-6 ${brand.color.primary} rounded flex items-center justify-center`}>
                  <JobMapIcon size={18} className="text-white" />
                </div>
              </div>
              {showLogoHover && (
                <div className="absolute left-full ml-2 z-50">
                  <button
                    onClick={handleToggle}
                    className={`${sidebar["toggle-button"]} rounded-lg shadow-lg`}
                    aria-label="Open sidebar"
                  >
                    <SidePanelOpen size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {isOpen && (
            <button
              onClick={handleToggle}
              className={sidebar["toggle-button"]}
              aria-label="Close sidebar"
            >
              <SidePanelClose size={20} style={{ color: "rgba(87, 87, 87, 1)" }} />
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
            const isDisabled = !isActive && item.id !== "jobs-near-you";
            return (
              <li key={item.id}>
                <button
                  onClick={() => !isDisabled && handleNavigation(item.route)}
                  disabled={isDisabled}
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

      {/* Onboarding Section */}
      <div className="p-2 pb-1">
        <button
          onClick={() => handleNavigation("/onboarding")}
          className={`${sidebar["nav-button"]} ${
            isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
          } ${sidebar["nav-button-hover"]}`}
        >
          <div className={sidebar["nav-icon-container"]}>
            <IbmLpa
              size={24}
              style={{ color: "rgba(87, 87, 87, 1)" }}
            />
          </div>
          {isOpen && <span className={sidebar["nav-text"]}>Onboarding</span>}
        </button>
      </div>

      {/* What's New Section */}
      <div className="p-2 pt-1 pb-1">
        <button
          className={`${sidebar["nav-button"]} ${
            isOpen ? sidebar["nav-button-expanded"] : sidebar["nav-button-collapsed"]
          } ${sidebar["nav-button-hover"]}`}
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

      {/* User Profile Section */}
      <div className={`p-2 pt-1 relative`} ref={userDropdownRef}>
        {isOpen ? (
          <button
            onClick={handleUserClick}
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-expanded"]} ${sidebar["nav-button-hover"]} ${sidebar["user-button-expanded"]}`}
          >
            <div className={sidebar["nav-icon-container"]}>
              <UserAvatar
                size={24}
                style={{ color: "rgba(87, 87, 87, 1)" }}
              />
            </div>
            <span className={sidebar["nav-text"]}>John Doe</span>
          </button>
        ) : (
          <button
            onClick={handleUserClick}
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-collapsed"]} ${sidebar["nav-button-hover"]} ${sidebar["user-button-collapsed"]}`}
          >
            <div className={sidebar["nav-icon-container"]}>
              <Logout
                size={24}
                style={{ color: "rgba(87, 87, 87, 1)" }}
              />
            </div>
          </button>
        )}

        {/* User Dropdown */}
        {showUserDropdown && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-brand-bg-white border border-brand-stroke-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <button
                className="w-full text-left px-4 py-2 text-brand-stroke-strong hover:bg-brand-stroke-weak rounded transition-colors flex items-center space-x-2"
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/profile");
                }}
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-brand-stroke-strong hover:bg-brand-stroke-weak rounded transition-colors flex items-center space-x-2"
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/settings");
                }}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <div className="border-t border-brand-stroke-border my-1" />
              <button
                className="w-full text-left px-4 py-2 text-brand-stroke-strong hover:bg-brand-stroke-weak rounded transition-colors flex items-center space-x-2"
                onClick={() => {
                  setShowUserDropdown(false);
                  // Handle logout
                }}
              >
                <Logout size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
