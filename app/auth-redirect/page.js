"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function AuthRedirect() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

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
        } else {
          router.replace("/who-are-you");
        }
      })
      .catch(() => router.replace("/"));
  }, [isLoaded, userId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg-fill">
      <p className="text-brand-text-weak">Redirecting...</p>
    </div>
  );
}
