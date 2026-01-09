"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import EmailAuthForm from "./components/Onboarding/EmailAuthForm";

export default function Home() {
  const [showAuth, setShowAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Handle email authentication
  const handleEmailAuth = async ({ email, password, isRegister }) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual authentication logic
      // For now, just hide the overlay
      console.log("Email auth:", { email, password, isRegister });
      setShowAuth(false);
    } catch (error) {
      console.error("Auth error:", error);
      alert(`Error: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black relative">
      {/* Sidebar - Left Side */}
      <Sidebar activeItem="jobs-near-you" />

      {/* Map Component - Right Side (Main Content) with 50% opacity when auth overlay is shown */}
      <div className={`flex-1 relative ${showAuth ? "opacity-50" : "opacity-100"} transition-opacity duration-300`}>
        <Map />
      </div>

      {/* Email Authentication Overlay */}
      {showAuth && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur overlay background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(3px)",
            }}
          />
          
          {/* Email Auth Form */}
          <div className="relative z-10" style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
            <EmailAuthForm onSubmit={handleEmailAuth} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
}
