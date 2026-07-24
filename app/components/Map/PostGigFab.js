"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PostGigFab({ accountType }) {
  const router = useRouter();
  const label = accountType === "Company" ? "Post a job" : "Post a gig";
  const route = accountType === "Company" ? "/onboarding.org" : "/onboarding";

  return (
    <button
      type="button"
      onClick={() => router.push(route)}
      className="fixed right-8 bottom-16 z-[1500] flex items-center gap-2 rounded-full border border-brand-stroke-weak bg-white px-4 py-2.5 shadow-md transition-all hover:bg-brand-bg-fill hover:shadow-lg active:scale-[0.98]"
      aria-label={label}
      title={label}
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <Image
        src="/icons/fab/post-gig.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain shrink-0"
        unoptimized
      />
      <span className="text-sm font-semibold text-brand-text-strong whitespace-nowrap">{label}</span>
    </button>
  );
}
