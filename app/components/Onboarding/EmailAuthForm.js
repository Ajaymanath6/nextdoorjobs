"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Location, UserMultiple, Chat } from "@carbon/icons-react";

export default function EmailAuthForm({ onSubmit, isLoading = false }) {
  const { signIn } = useSignIn();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (!signIn) {
      alert("Authentication service is not available. Please refresh the page.");
      return;
    }

    setIsGoogleLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = origin
        ? `${origin}/api/auth/callback/clerk`
        : "/api/auth/callback/clerk";
      const redirectUrlComplete = origin ? `${origin}/auth-redirect` : "/auth-redirect";
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (error) {
      console.error("Google auth error:", error);
      alert("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    if (!signIn) {
      alert("Authentication service is not available. Please refresh the page.");
      return;
    }

    setIsLinkedInLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = origin
        ? `${origin}/api/auth/callback/clerk`
        : "/api/auth/callback/clerk";
      const redirectUrlComplete = origin ? `${origin}/auth-redirect` : "/auth-redirect";
      await signIn.authenticateWithRedirect({
        strategy: "oauth_linkedin_oidc",
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (error) {
      console.error("LinkedIn auth error:", error);
      alert("Failed to sign in with LinkedIn. Please try again.");
      setIsLinkedInLoading(false);
    }
  };

  return (
    <div
      className="w-full box-border flex flex-col"
      style={{
        marginLeft: "24px",
        marginRight: "24px",
        marginTop: "24px",
        maxWidth: "calc(100vw - 48px)",
        minHeight: "calc(100dvh - 48px)",
      }}
    >
      <div
        className="relative rounded-lg p-8 pt-6 pb-16 border border-brand-stroke-weak w-full overflow-hidden flex-1 min-h-0 flex flex-col"
        style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.7) 0%, #fff 25%, #fff 75%, rgba(255,255,255,0.7) 100%)",
        }}
      >
        {/* Decorative cloud – left and right, increased size, vertical middle */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-85" aria-hidden>
          <Image src="/cloud.png" alt="" fill className="object-contain object-left" sizes="288px" />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-85" aria-hidden>
          <Image src="/cloud.png" alt="" fill className="object-contain object-right" sizes="288px" />
        </div>

        {/* Bottom blend: soft fade into background image */}
        <div
          className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #fff 0%, rgba(255,255,255,0.6) 40%, transparent 100%)",
          }}
        />
        {/* Clerk CAPTCHA widget container - required for Smart CAPTCHA bot protection */}
        <div id="clerk-captcha" style={{ display: "none" }} />

        {/* Header bar – inside card, top; half width, full rounded (pill), light border, soft shadow */}
        <header className="relative flex items-center justify-between w-1/2 mx-auto py-4 px-6 border border-brand-stroke-weak rounded-full shrink-0 shadow-sm bg-white/80">
          <div className="flex items-center gap-6">
            <Image
              src="/logo.svg"
              alt="mapmyGig"
              width={28}
              height={28}
              className="h-7 w-auto"
              style={{ width: "auto", height: "1.75rem" }}
              loading="eager"
              priority
            />
            <nav className="flex items-center gap-5">
              <a href="#product" className="text-sm font-medium text-brand-text-strong hover:opacity-80">Product</a>
              <a href="#imagine" className="text-sm font-medium text-brand-text-strong hover:opacity-80">Imagine</a>
              <a href="#community" className="text-sm font-medium text-brand-text-strong hover:opacity-80">Community</a>
              <a href="#pricing" className="text-sm font-medium text-brand-text-strong hover:opacity-80">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm font-medium text-brand-text-strong hover:opacity-80 bg-transparent border-0 cursor-pointer py-2 px-0"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Login
            </button>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-text-strong hover:opacity-90 transition-opacity"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Try mapmyGig for free
            </a>
          </div>
        </header>

        {/* Content area – scrollable, leaves room for bottom cards */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="relative mx-auto pt-8 px-2 shrink-0" style={{ maxWidth: "680px" }}>
            {/* Headline – 4 words, single line, 56px */}
            <h1
              className="text-center text-brand-text-strong font-semibold mb-4 leading-tight whitespace-nowrap"
              style={{ fontFamily: "var(--font-geist-sans), Open Sans, sans-serif", fontSize: "56px" }}
            >
              Gigs. Jobs. Community. Local.
            </h1>
            <p className="text-center text-sm text-brand-text-weak mb-6" style={{ fontFamily: "Open Sans, sans-serif" }}>
              Sign in once. Get full access.
            </p>

            {/* Social Sign-in Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-brand-stroke-weak rounded-lg bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{isGoogleLoading ? "Connecting..." : "Continue with Google"}</span>
              </button>

              <button
                type="button"
                onClick={handleLinkedInAuth}
                disabled={isLoading || isLinkedInLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-brand-stroke-weak rounded-lg bg-brand-bg-white text-brand-text-strong hover:bg-brand-bg-fill transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>{isLinkedInLoading ? "Connecting..." : "Continue with LinkedIn"}</span>
              </button>
            </div>

            <p className="text-center text-brand-text-weak text-xs mt-5" style={{ fontFamily: "Open Sans, sans-serif" }}>
              Find work and connect—all in your neighborhood
            </p>

            <div className="mt-4 text-center">
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-text-weak hover:text-brand-text-strong hover:underline transition-colors"
                style={{ fontFamily: "Open Sans, sans-serif" }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Feature cards – aligned to bottom of main card, no tilt, cloud avatar on each */}
          <div className="mt-auto shrink-0 px-2 pb-6 pt-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
              <div className="relative overflow-hidden rounded-xl border border-brand-stroke-weak bg-white/90 p-5 shadow-sm flex items-start gap-3 min-h-[120px]">
                <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                  <Image src="/cloud-avatar.png" alt="" width={64} height={64} className="object-contain object-top-left" />
                </div>
                <div className="flex-1 min-w-0 pl-0 pt-0">
                  <div className="flex items-center gap-2 text-brand-text-strong font-medium mb-1.5 text-sm" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    <Location size={18} className="text-brand shrink-0" />
                    <span>Finding gig workers near you</span>
                  </div>
                  <p className="text-xs text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    Discover and hire local talent.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-brand-stroke-weak bg-white/90 p-5 shadow-sm flex items-start gap-3 min-h-[120px]">
                <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                  <Image src="/cloud-avatar.png" alt="" width={64} height={64} className="object-contain object-top-left" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-brand-text-strong font-medium mb-1.5 text-sm" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    <UserMultiple size={18} className="text-brand shrink-0" />
                    <span>Post jobs. Hire local.</span>
                  </div>
                  <p className="text-xs text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    Reach nearby candidates fast.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-brand-stroke-weak bg-white/90 p-5 shadow-sm flex items-start gap-3 min-h-[120px]">
                <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                  <Image src="/cloud-avatar.png" alt="" width={64} height={64} className="object-contain object-top-left" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-brand-text-strong font-medium mb-1.5 text-sm" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    <Chat size={18} className="text-brand shrink-0" />
                    <span>Connect with your community</span>
                  </div>
                  <p className="text-xs text-brand-text-weak" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    Chat and collaborate locally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
