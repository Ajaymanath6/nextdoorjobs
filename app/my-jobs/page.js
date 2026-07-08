"use client";

import AppShell from "../components/AppShell";

export default function MyJobsPage() {
  return (
    <AppShell activeItem="manage-jds">
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-sm text-brand-text-weak font-sans">My jobs — coming soon</p>
      </div>
    </AppShell>
  );
}
