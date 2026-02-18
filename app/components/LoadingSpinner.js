"use client";

export default function LoadingSpinner({ size = "md", overlay = false }) {
  const sizes = {
    sm: "h-4 w-4 border",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-2",
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full ${sizes[size]} border-brand border-t-transparent`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/80 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
