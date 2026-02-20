"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Head from "next/head";
import themeClasses from "../theme-utility-classes.json";
import { ACCOUNT_TYPES } from "../../lib/constants/accountTypes";

const brand = themeClasses.brand;
const PRIMARY = "#F84416";

function UserDuotoneIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" fill={PRIMARY} className="shrink-0">
      <path d="M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z" opacity="0.2" />
      <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
    </svg>
  );
}

function BuildingOfficeDuotoneIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" fill={PRIMARY} className="shrink-0">
      <path d="M176,40V216H136V160H88v56H48V40Z" opacity="0.2" />
      <path d="M248,208H232V96a8,8,0,0,0,0-16H184V48a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16V208H24a8,8,0,0,0,0,16H248a8,8,0,0,0,0-16ZM216,96V208H184V96ZM56,48H168V208H144V160a8,8,0,0,0-8-8H88a8,8,0,0,0-8,8v48H56Zm72,160H96V168h32ZM72,80a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,80Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H128A8,8,0,0,1,120,80ZM72,120a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,120Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H128A8,8,0,0,1,120,120Z" />
    </svg>
  );
}

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
        const accountType = data?.user?.accountType;
        const hasAccountType = accountType === "Individual" || accountType === "Company";
        if (data?.success && data.user && hasAccountType) {
          router.replace("/");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        // On network/API error, send to map so we don't show who-are-you to existing users
        router.replace("/");
      });
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
        setTimeout(() => {
          router.push("/");
        }, 2000);
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
      <>
        <Head>
          <link rel="preload" href="/account-type-bg.png" as="image" />
        </Head>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-3 bg-brand-bg-fill"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          <div
            className="rounded-full h-10 w-10 border-2 border-brand-stroke-weak border-t-brand animate-spin"
            aria-hidden
          />
          <p className="text-brand-text-strong text-sm">Loading…</p>
        </div>
      </>
    );
  }

  if (submitting) {
    return (
      <>
        <Head>
          <link rel="preload" href="/account-type-bg.png" as="image" />
        </Head>
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
          style={{
            fontFamily: "Open Sans, sans-serif",
            backgroundImage: "url(/account-type-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="rounded-full h-12 w-12 border-4 loading-spinner mx-auto mb-4"
            style={{ borderColor: "rgba(0,0,0,0.1)", borderTopColor: "#F84416" }}
          />
          <p className="text-gray-600" style={{ fontFamily: "Open Sans, sans-serif" }}>
            Loading...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <link rel="preload" href="/account-type-bg.png" as="image" />
      </Head>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
        style={{
          fontFamily: "Open Sans, sans-serif",
          backgroundImage: "url(/account-type-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        <h1
          className={`text-2xl font-semibold ${brand.text.strong} mb-2 text-center`}
        >
          Who are you?
        </h1>
        <p className={`text-sm ${brand.text.weak} mb-8 text-center max-w-md`}>
          Choose how you want to use mapmyGig.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {ACCOUNT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={submitting}
              onClick={() => handleSelect(value)}
              className="flex items-center gap-4 p-6 rounded-xl bg-brand-bg-white/95 hover:bg-brand-bg-white transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              <div className="shrink-0 w-14 h-14 rounded-full bg-brand-bg-fill flex items-center justify-center">
                {value === "Company" ? (
                  <BuildingOfficeDuotoneIcon size={28} />
                ) : (
                  <UserDuotoneIcon size={28} />
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
    </div>
    </>
  );
}
