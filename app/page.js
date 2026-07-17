"use client";

import AppShell from "./components/AppShell";
import HomeJobsView from "./components/Home/HomeJobsView";

export default function HomePage() {
  return (
    <AppShell activeItem="home">
      {({ effectiveUser, effectiveUserLoading, onOpenSettings }) => (
        <HomeJobsView
          user={effectiveUser}
          loading={effectiveUserLoading}
          onOpenSettings={onOpenSettings}
        />
      )}
    </AppShell>
  );
}
