"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import EmailAuthForm from "./EmailAuthForm";

const Map = dynamic(() => import("../Map/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-brand-bg-fill">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-stroke-weak border-t-brand rounded-full loading-spinner mx-auto mb-3" />
        <p className="text-sm text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Loading map…
        </p>
      </div>
    </div>
  ),
});

/**
 * Interactive jobs map for unauthenticated /onboarding visitors.
 */
export default function GuestJobsMap({ onRequireAuth }) {
  return (
    <div className="relative w-full h-full min-h-0">
      <Map
        guestMode
        onRequireAuth={onRequireAuth}
        effectiveUser={null}
        effectiveUserLoading={false}
      />
    </div>
  );
}

function GuestAuthModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-auth-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] border-0 cursor-default"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[420px] max-h-[min(90dvh,720px)] overflow-y-auto rounded-2xl bg-brand-bg-white shadow-2xl border border-brand-stroke-weak">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full text-brand-text-weak hover:bg-brand-bg-fill hover:text-brand-text-strong transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="px-6 pt-8 pb-6">
          <EmailAuthForm
            variant="modal"
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Guest landing: full-viewport jobs map only.
 * Apply / gated actions open a modern signup/login modal.
 */
export function GuestOnboardingLanding({ onSubmit, isLoading }) {
  const [authOpen, setAuthOpen] = useState(false);

  const openAuth = useCallback(() => {
    setAuthOpen(true);
  }, []);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-brand-bg-fill">
      <div className="w-full h-full relative">
        <GuestJobsMap onRequireAuth={openAuth} />
      </div>
      <GuestAuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
