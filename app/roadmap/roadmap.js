"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import InputField from "../components/InputField";
import SettingsModal from "../components/SettingsModal";

export default function RoadmapPage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg-fill">
      {/* Sidebar - Left Side */}
      <Sidebar activeItem="roadmap" onOpenSettings={() => setShowSettingsModal(true)} />

      {/* Main Content - Right Side */}
      <main className="flex-1 overflow-y-auto bg-brand-bg-fill">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Card */}
            <div className="bg-brand-bg-white border border-brand-stroke-weak rounded-lg p-6">
              {/* Title */}
              <h2 className="text-brand-text-strong text-2xl font-semibold mb-2">
                Card Title
              </h2>
              
              {/* Subtitle */}
              <p className="text-brand-text-weak text-base mb-4">
                Card subtitle or description text goes here
              </p>
              
              {/* Input Field */}
              <div className="mb-4">
                <InputField
                  type="text"
                  label="Input Label"
                  placeholder="Enter text here"
                />
              </div>
              
              {/* Divider */}
              <div className="border-t border-brand-stroke-weak my-4"></div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button className="bg-brand text-brand-bg-white hover:bg-brand-hover rounded-md px-4 py-2 transition-colors">
                  Primary Button
                </button>
                <button className="border-[1.5px] border-brand-stroke-weak text-brand-secondary bg-transparent hover:bg-brand-secondary-hover rounded-md px-4 py-2 transition-colors">
                  Secondary Button
                </button>
              </div>
            </div>

            {/* Journey Card */}
            <div className="bg-brand-bg-white border border-brand-stroke-weak rounded-lg p-6 mt-6">
              {/* Title */}
              <h2 className="text-brand-text-strong text-2xl font-semibold mb-2">
                Next Upcoming Feature
              </h2>
              
              {/* Subtitle */}
              <p className="text-brand-text-weak text-base mb-4">
                Journey card subtitle describing the upcoming feature
              </p>
              
              {/* Divider */}
              <div className="border-t border-brand-stroke-weak my-4"></div>
              
              {/* Buttons - All 4 Types */}
              <div className="flex flex-wrap gap-3">
                {/* Primary Button */}
                <button className="bg-brand text-brand-bg-white hover:bg-brand-hover rounded-md px-4 py-2 transition-colors">
                  Primary Button
                </button>
                
                {/* Secondary Button */}
                <button className="bg-brand-secondary text-brand-bg-white hover:bg-brand-secondary-hover rounded-md px-4 py-2 transition-colors">
                  Secondary Button
                </button>
                
                {/* Outline Button */}
                <button className="bg-brand-bg-white border-[1.5px] border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill rounded-md px-4 py-2 transition-colors">
                  Outline Button
                </button>
                
                {/* Ghost Button */}
                <button className="bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill rounded-md px-4 py-2 transition-colors">
                  Ghost Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
