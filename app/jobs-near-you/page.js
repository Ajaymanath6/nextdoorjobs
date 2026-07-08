"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import Map from "../components/Map/Map";
import PostGigFab from "../components/Map/PostGigFab";

export default function JobsNearYouPage() {
  const [viewMode, setViewMode] = useState("person");

  return (
    <AppShell activeItem="jobs-near-you" viewMode={viewMode} onViewModeChange={setViewMode}>
      {({ effectiveUser, effectiveUserLoading, setViewMode: setShellViewMode, onOpenSettings }) => (
        <div className="relative h-full w-full">
          <Map
            onOpenSettings={onOpenSettings}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              setShellViewMode?.(mode);
            }}
            effectiveUser={effectiveUser}
            effectiveUserLoading={effectiveUserLoading}
          />
          <PostGigFab accountType={effectiveUser?.accountType} />
        </div>
      )}
    </AppShell>
  );
}
