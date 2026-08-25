"use client";

import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import EmailAuthForm from "./EmailAuthForm";
import ProfileBubbleBackground from "./ProfileBubbleBackground";

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
 * Pan/zoom + company pins/sidebar work; gated actions call onRequireAuth.
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

/**
 * Full guest landing: viewport-tall map, then signup below.
 * Uses a fixed-height scroll container so users can scroll down and back up
 * (html/body are overflow:hidden app-wide).
 */
export function GuestOnboardingLanding({ onSubmit, isLoading }) {
  const scrollRef = useRef(null);

  const scrollToSignup = useCallback(() => {
    const container = scrollRef.current;
    const el = typeof document !== "undefined" ? document.getElementById("signup") : null;
    if (!container || !el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = elRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <div
      ref={scrollRef}
      data-guest-scroll
      className="h-[100dvh] w-full overflow-y-auto overscroll-y-contain bg-brand-bg-fill"
    >
      <div className="w-full h-[100dvh] relative shrink-0 border-b border-brand-stroke-weak">
        <GuestJobsMap onRequireAuth={scrollToSignup} />
      </div>
      <div
        className="relative w-full shrink-0 bg-brand-bg-fill bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/back.png)" }}
      >
        <ProfileBubbleBackground />
        <div className="relative z-10 flex items-start justify-center px-0 py-4">
          <EmailAuthForm onSubmit={onSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
