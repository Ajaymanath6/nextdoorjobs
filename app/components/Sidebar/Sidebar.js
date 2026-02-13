"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useClerk } from '@clerk/nextjs';
import Image from "next/image";
import themeClasses from "../../theme-utility-classes.json";
import {
  Home,
  Document,
  Archive,
  OpenPanelLeft,
  SidePanelOpen,
  Logout,
  ThumbsUpDouble,
  Bullhorn,
  UserAvatar,
  EarthFilled,
  User,
  Settings,
} from "@carbon/icons-react";

export default function Sidebar({ activeItem = "jobs-near-you", onToggle, isOpen: externalIsOpen }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(externalIsOpen !== undefined ? externalIsOpen : true);
  const [userEmail, setUserEmail] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, bottom: 0 });
  const [portalTarget, setPortalTarget] = useState(null);
  const profileRef = useRef(null);

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

  // Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUserEmail(data.user.email || "");
            setUserAvatarUrl(data.user.avatarUrl || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const onAvatarUpdated = () => {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.user) {
            setUserEmail(data.user.email || "");
            setUserAvatarUrl(data.user.avatarUrl || "");
          }
        })
        .catch(() => {});
    };
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated);
  }, []);

  // Portal root: outside layout so dropdown is never clipped by body/sidebar overflow
  useEffect(() => {
    const root = document.createElement("div");
    root.id = "sidebar-dropdown-portal-root";
    root.setAttribute("aria-hidden", "true");
    root.style.cssText =
      "position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:visible;";
    document.body.appendChild(root);
    setPortalTarget(root);
    return () => {
      if (root.parentNode) root.parentNode.removeChild(root);
      setPortalTarget(null);
    };
  }, []);

  // Position dropdown as overlay (above sidebar) and close on outside click
  const updateDropdownPosition = () => {
    if (!profileRef.current) return;
    const rect = profileRef.current.getBoundingClientRect();
    const gapAbove = 8;
    setDropdownPosition({
      left: rect.left + 4,
      bottom: window.innerHeight - rect.top + gapAbove,
    });
  };

  useLayoutEffect(() => {
    if (!showUserDropdown) return;
    updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showUserDropdown]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        const portalEl = document.getElementById("sidebar-dropdown-portal");
        if (portalEl?.contains(e.target)) return;
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Clerk first (if authenticated via Clerk)
      if (signOut) {
        try {
          await signOut();
        } catch (clerkError) {
          console.error("Clerk signout error:", clerkError);
          // Continue with API logout even if Clerk signout fails
        }
      }

      // Clear session cookie via API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setShowUserDropdown(false);
        // Redirect to home page which will show auth overlay
        router.push("/");
        // Reload to clear any cached state
        window.location.reload();
      } else {
        alert("Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout. Please try again.");
    }
  };

  return (
    <aside
      className={`h-screen flex flex-col ${
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

      {/* What's New Section */}
      <div className="p-2 pt-1 pb-1">
        <button
          onClick={() => handleNavigation("/roadmap")}
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

      {/* User Profile Section - click opens drop-up menu */}
      <div className={`p-2 pt-1 relative`} ref={profileRef}>
        {isOpen ? (
          <button
            type="button"
            onClick={() => setShowUserDropdown((v) => !v)}
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-expanded"]} ${sidebar["nav-button-hover"]} ${sidebar["user-button-expanded"]}`}
            aria-label="Profile menu"
            aria-expanded={showUserDropdown}
          >
            <div className={`${sidebar["nav-icon-container"]} flex items-center justify-center shrink-0`}>
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt="Profile"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <UserAvatar
                  size={24}
                  style={{ color: "rgba(87, 87, 87, 1)" }}
                />
              )}
            </div>
            <span className={`${sidebar["nav-text"]} truncate`} title={userEmail}>
              {userEmail || "—"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowUserDropdown((v) => !v)}
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-collapsed"]} ${sidebar["nav-button-hover"]} ${sidebar["user-button-collapsed"]}`}
            aria-label="Profile menu"
            aria-expanded={showUserDropdown}
          >
            <div className={`${sidebar["nav-icon-container"]} flex items-center justify-center shrink-0`}>
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt="Profile"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <UserAvatar
                  size={24}
                  style={{ color: "rgba(87, 87, 87, 1)" }}
                />
              )}
            </div>
          </button>
        )}

        {/* Drop-up menu rendered as overlay via portal so it is not clipped by sidebar */}
      </div>

      {portalTarget &&
        showUserDropdown &&
        createPortal(
          <div
            id="sidebar-dropdown-portal"
            role="menu"
            className="min-w-[16rem] max-w-[24rem] w-max overflow-y-auto rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg"
            style={{
              position: "fixed",
              left: dropdownPosition.left,
              bottom: dropdownPosition.bottom,
              zIndex: 100000,
              pointerEvents: "auto",
              maxHeight: "min(70vh, 320px)",
            }}
          >
            <div className="p-2">
              <div
                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-text-strong break-all border-b border-brand-stroke-weak mb-1"
                title={userEmail || "Signed in"}
              >
                <User size={20} className="shrink-0 text-brand-stroke-strong" />
                <span>{userEmail || "Signed in"}</span>
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill rounded transition-colors flex items-center gap-2"
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/settings");
                }}
              >
                <Settings size={20} className="text-brand-stroke-strong shrink-0" />
                <span>Settings</span>
              </button>
              <div className="border-t border-brand-stroke-weak my-1" />
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill rounded transition-colors flex items-center gap-2"
                onClick={handleLogout}
              >
                <Logout size={20} className="text-brand-stroke-strong shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>,
          portalTarget
        )}
    </aside>
  );
}
