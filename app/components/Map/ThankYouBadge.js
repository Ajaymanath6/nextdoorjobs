"use client";

import { useState } from "react";

const DEFAULT_LOGO_URL =
  "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/users/user_2zMtrqo9RMaaIn4f8F2z3oeY497/avatar.png";
const FALLBACK_LOGO_URL =
  "https://placehold.co/96x96/27272a/ffffff?text=Logo";

/**
 * Central logo image for the thank-you badge.
 * Uses theme-aligned rounded and shadow.
 */
function CentralLogo({ logoUrl, size = 10 }) {
  const [src, setSrc] = useState(logoUrl || DEFAULT_LOGO_URL);
  const handleError = () => {
    setSrc(FALLBACK_LOGO_URL);
  };
  return (
    <img
      src={src}
      alt="Logo"
      className="rounded-full object-cover shadow-lg"
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={handleError}
    />
  );
}

/**
 * Thank-you badge: central logo only (no arc text).
 * Optional diameter and logoUrl for map overlay use.
 */
export default function ThankYouBadge({
  diameter = 90,
  logoUrl,
}) {
  const logoSize = Math.max(28, Math.min(40, Math.round(diameter * 0.4)));

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: diameter, height: diameter }}
    >
      <div className="relative z-10">
        <CentralLogo logoUrl={logoUrl} size={logoSize} />
      </div>
    </div>
  );
}
