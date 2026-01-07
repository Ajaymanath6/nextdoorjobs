"use client";

import { Query } from "@carbon/icons-react";
import themeClasses from "../../theme-utility-classes.json";

export default function EmptyState({ isOpen, onClose, query = "" }) {
  // Debug logging
  console.log("🔍 EmptyState render:", { isOpen, query });
  
  if (!isOpen) return null;

  const brand = themeClasses.brand;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 flex items-center justify-center cursor-pointer"
      style={{
        zIndex: 998, // Below loading overlay (999) but above map
        backgroundColor: "rgba(255, 255, 255, 0.9)", // 90% white overlay, 10% map visible
        backdropFilter: "blur(1px)",
      }}
    >
      <div
        className="text-center"
        style={{
          maxWidth: "500px",
          padding: "40px 24px",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on content
      >
        {/* Query Icon */}
        <div
          className="mx-auto mb-6 flex items-center justify-center"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--brand-stroke-weak)",
          }}
        >
          <Query
            size={32}
            style={{
              color: "var(--brand-stroke-strong)",
            }}
          />
        </div>

        {/* Message */}
        <h2
          className={`${brand.text.strong} mb-2`}
          style={{
            fontFamily: "Open Sans",
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: "1.4",
            marginBottom: "8px",
          }}
        >
          {query && (query.toLowerCase().includes('college') || query.toLowerCase().includes('university') || query.toLowerCase().includes('institute'))
            ? "We haven't reached the college you're searching for"
            : "We haven't reached the locality you're searching for"}
        </h2>

        {query && (
          <p
            className={brand.text.weak}
            style={{
              fontFamily: "Open Sans",
              fontSize: "14px",
              opacity: 0.7,
              marginTop: "8px",
            }}
          >
            Searched for: <span style={{ fontWeight: 600 }}>{query}</span>
          </p>
        )}

        {/* Hint */}
        <p
          className={brand.text.tertiary}
          style={{
            fontFamily: "Open Sans",
            fontSize: "12px",
            marginTop: "16px",
            opacity: 0.6,
          }}
        >
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}

