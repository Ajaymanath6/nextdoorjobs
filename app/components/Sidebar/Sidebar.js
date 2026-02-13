"use client";

import { useState, useEffect } from "react";
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
} from "@carbon/icons-react";

export default function Sidebar({ activeItem = "jobs-near-you", onToggle, isOpen: externalIsOpen }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(externalIsOpen !== undefined ? externalIsOpen : true);
  const [userEmail, setUserEmail] = useState("");

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
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

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

      {/* User Profile Section - display only (no click action) */}
      <div className={`p-2 pt-1`}>
        {isOpen ? (
          <div
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-expanded"]} ${sidebar["user-button-expanded"]} cursor-default`}
          >
            <div className={sidebar["nav-icon-container"]}>
              <UserAvatar
                size={24}
                style={{ color: "rgba(87, 87, 87, 1)" }}
              />
            </div>
            <span className={`${sidebar["nav-text"]} truncate`} title={userEmail}>
              {userEmail || "—"}
            </span>
          </div>
        ) : (
          <div
            className={`${sidebar["nav-button"]} ${sidebar["nav-button-collapsed"]} ${sidebar["user-button-collapsed"]}`}
          >
            <div className={sidebar["nav-icon-container"]}>
              <UserAvatar
                size={24}
                style={{ color: "rgba(87, 87, 87, 1)" }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
