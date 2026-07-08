"use client";

import AppShell from "./components/AppShell";

export default function HomePage() {
  return (
    <AppShell activeItem="home">
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-sm text-brand-text-weak font-sans">Home — coming soon</p>
      </div>
    </AppShell>
  );
}
