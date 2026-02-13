"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import themeClasses from "../theme-utility-classes.json";
import { ACCOUNT_TYPES } from "../../lib/constants/accountTypes";
import { Enterprise, UserAvatar } from "@carbon/icons-react";

const brand = themeClasses.brand;

export default function WhoAreYouPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/onboarding");
      return;
    }
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user?.accountType) {
          router.replace("/onboarding");
          return;
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [isLoaded, userId, router]);

  const handleSelect = async (value) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: value }),
        credentials: "same-origin",
      });
      if (res.ok) {
        router.push("/onboarding");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "Failed to save. Try again.");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  if (!isLoaded || checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-brand-bg-fill"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        <p className={brand.text.weak}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-brand-bg-fill px-4 py-8"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <h1
        className={`text-2xl font-semibold ${brand.text.strong} mb-2 text-center`}
      >
        Who are you?
      </h1>
      <p className={`text-sm ${brand.text.weak} mb-8 text-center max-w-md`}>
        Choose how you want to use mapmyGig.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        {ACCOUNT_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={submitting}
            onClick={() => handleSelect(value)}
            className="flex items-center gap-4 p-6 rounded-xl border-2 border-brand-stroke-border bg-brand-bg-white hover:border-brand hover:bg-brand-stroke-weak transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="shrink-0 w-14 h-14 rounded-full bg-brand-bg-fill flex items-center justify-center border border-brand-stroke-weak">
              {value === "Company" ? (
                <Enterprise size={28} className="text-brand-stroke-strong" />
              ) : (
                <UserAvatar size={28} className="text-brand-stroke-strong" />
              )}
            </div>
            <div>
              <span className={`block font-semibold text-base ${brand.text.strong}`}>
                {label}
              </span>
              {value === "Company" && (
                <span className={`text-sm ${brand.text.weak}`}>
                  Post your job openings
                </span>
              )}
              {value === "Individual" && (
                <span className={`text-sm ${brand.text.weak}`}>
                  Find jobs or post your gig
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
