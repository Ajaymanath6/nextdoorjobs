"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { At, Screen } from "@carbon/icons-react";

export default function ChatInterface({ messages = [], onSendMessage, isLoading = false }) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showClipTooltip, setShowClipTooltip] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input && input.value.trim()) {
      onSendMessage(input.value.trim());
      input.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* Logo - Left Side */}
        <div className="flex items-center justify-start mb-4">
          <div className="h-8 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="JobsonMap"
              width={0}
              height={32}
              className="h-8 w-auto"
            />
          </div>
        </div>

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-[#F84416] text-white"
                  : index === 0 && message.type === "ai"
                  ? "bg-white text-gray-900"
                  : "bg-gray-100 text-gray-900"
              }`}
              style={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: index === 0 && message.type === "ai" ? "15px" : "14px",
                lineHeight: "1.5",
                fontWeight: index === 0 && message.type === "ai" ? 500 : 400,
              }}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-[#E5E5E5] bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-brand-stroke-weak rounded-md text-sm text-brand-text-strong"
              >
                <span>{file.name}</span>
                <button
                  onClick={() => {
                    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                  }}
                  className="text-brand-text-weak hover:text-brand-text-strong"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Inside chat area at bottom */}
      <div className="border-t border-[#E5E5E5] px-4 py-4 bg-white relative">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            placeholder="Type your message..."
            className="w-full min-h-[140px] pl-2 pr-2 py-4 bg-brand-bg-white border border-brand-stroke-border rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill resize-none text-base m-0 placeholder:text-brand-text-placeholder text-brand-text-strong"
            style={{ fontFamily: "Open Sans, sans-serif", borderWidth: "1px" }}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          {/* Icons at Left Bottom */}
          <div className="absolute bottom-4 left-2 flex items-center gap-3 z-10">
            {/* @ Icon - Left of Screenshot */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  // Handle @ mention functionality
                  console.log("@ clicked");
                }}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
              >
                <At size={20} className="text-brand-stroke-strong" />
              </button>
            </div>

            {/* Screenshot Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  // Handle screenshot functionality
                  console.log("Screenshot clicked");
                }}
                onMouseEnter={() => setShowScreenshotTooltip(true)}
                onMouseLeave={() => setShowScreenshotTooltip(false)}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
              >
                <Screen size={20} className="text-brand-stroke-strong" />
              </button>
              {showScreenshotTooltip && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-brand-text-strong text-brand-bg-white text-xs rounded-md whitespace-nowrap z-50">
                  Take screenshot and paste
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-text-strong"></div>
                </div>
              )}
            </div>

            {/* Attachment Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  // Handle file attachment
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    setUploadedFiles([...uploadedFiles, ...files.map(f => ({ name: f.name, file: f }))]);
                  };
                  input.click();
                }}
                onMouseEnter={() => setShowClipTooltip(true)}
                onMouseLeave={() => setShowClipTooltip(false)}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
              >
                <At size={20} className="text-brand-stroke-strong" />
              </button>
              {showClipTooltip && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-brand-text-strong text-brand-bg-white text-xs rounded-md whitespace-nowrap z-50">
                  Attach documents or files
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-text-strong"></div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="absolute bottom-4 right-2 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md z-20 bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
