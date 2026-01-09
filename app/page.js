"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import EmailAuthForm from "./components/Onboarding/EmailAuthForm";

export default function Home() {
  const [showAuth, setShowAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // User is logged in, hide auth overlay
            setShowAuth(false);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle email authentication
  const handleEmailAuth = async ({ email, password, name, isRegister }) => {
    setIsLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { email, password, name: name || email.split("@")[0] } // Use provided name or email prefix
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show more detailed error message
        let errorMsg = data.error || "Authentication failed";
        // Show details if available (for debugging)
        if (data.details) {
          console.error("API Error Details:", data.details);
          if (data.stack) {
            console.error("API Error Stack:", data.stack);
          }
        }
        throw new Error(errorMsg);
      }

      if (data.success) {
        // Authentication successful, hide overlay
        setShowAuth(false);
        // Optionally reload to ensure session is set
        window.location.reload();
      }
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      alert(`Error: ${errorMessage}`);
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
      {showAuth && !checkingAuth && (
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
