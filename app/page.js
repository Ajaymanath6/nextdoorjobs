"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import SettingsModal from "./components/SettingsModal";

export default function Home() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black">
      {/* Sidebar - Left Side (hidden on mobile) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar activeItem="jobs-near-you" onOpenSettings={() => setShowSettingsModal(true)} />
      </div>

      {/* Map Component - Right Side (Main Content) */}
      <Map />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
