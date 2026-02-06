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
 * Text arranged in a circular arc. Each character is rotated around the circle.
 * Uses theme text and font; rotation via CSS animation in parent.
 */
function TextArc({ text, diameter = 90 }) {
  const characters = text.split("");
  const radius = diameter / 2;
  const angleStep = 360 / characters.length;

  return (
    <div className="relative" style={{ width: diameter, height: diameter }}>
      {characters.map((char, index) => {
        const angle = angleStep * index;
        return (
          <div
            key={index}
            className="absolute text-brand-text-strong font-bold text-xs md:text-sm"
            style={{
              height: `${radius}px`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "bottom center",
              top: 0,
              left: "50%",
              marginLeft: "-0.5em",
              fontFamily: "Open Sans, sans-serif",
            }}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Thank-you badge: rotating arc text with central logo.
 * Theme-only (Tailwind + theme-guide); no framer-motion; CSS rotation.
 * Optional diameter and logoUrl for map overlay use.
 */
export default function ThankYouBadge({
  diameter = 90,
  text = " THANK YOU • FOR VISITING •",
  logoUrl,
}) {
  const logoSize = Math.max(28, Math.min(40, Math.round(diameter * 0.4)));

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: diameter, height: diameter }}
    >
      {/* Rotating arc text - CSS animation instead of framer-motion */}
      <div
        className="absolute pointer-events-none animate-[spin_20s_linear_infinite]"
        style={{ width: diameter, height: diameter }}
      >
        <TextArc text={text} diameter={diameter} />
      </div>

      {/* Central logo */}
      <div className="relative z-10">
        <CentralLogo logoUrl={logoUrl} size={logoSize} />
      </div>
    </div>
  );
}
