"use client";

export default function TypingAnimation() {
  return (
    <div className="bg-brand-bg-fill rounded-lg px-4 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-brand-text-weak rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-brand-text-weak rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 bg-brand-text-weak rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
