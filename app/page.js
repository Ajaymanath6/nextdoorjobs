"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import SettingsModal from "./components/SettingsModal";

export default function Home() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const [viewMode, setViewMode] = useState("person");

  const handleOpenSettings = (section = null) => {
    setSettingsInitialSection(section ?? null);
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    setSettingsInitialSection(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black">
      {/* Sidebar - Left Side (hidden on mobile) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          activeItem="jobs-near-you"
          onOpenSettingsWithSection={handleOpenSettings}
          viewMode={viewMode}
        />
      </div>

      {/* Map Component - Right Side (Main Content) */}
      <Map onOpenSettings={() => handleOpenSettings()} onViewModeChange={setViewMode} />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
        initialSection={settingsInitialSection}
      />
    </div>
  );
}
