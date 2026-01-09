"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Screen, Document, Enterprise } from "@carbon/icons-react";
import TypingAnimation from "./TypingAnimation";

export default function ChatInterface({ messages = [], onSendMessage, isLoading = false, inlineComponent = null, typingText = null, onScrollRequest }) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showClipTooltip, setShowClipTooltip] = useState(false);
  const [showSavedFilesDropdown, setShowSavedFilesDropdown] = useState(false);
  const [savedFiles, setSavedFiles] = useState([]);
  const savedFilesDropdownRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Expose scroll function for external use (e.g., when dropdown opens)
  useEffect(() => {
    if (onScrollRequest) {
      // Store the scroll function so it can be called from parent
      const scrollToInline = () => {
        if (messagesContainerRef.current) {
          // Find the inline component in the DOM and scroll to it
          const inlineElement = messagesContainerRef.current.querySelector('[data-inline-component]');
          if (inlineElement) {
            // Scroll to show the dropdown fully with extra space at bottom
            setTimeout(() => {
              inlineElement.scrollIntoView({ behavior: "smooth", block: "center" });
              // Additional scroll to ensure dropdown is visible
              setTimeout(() => {
                messagesContainerRef.current?.scrollBy({ top: 100, behavior: "smooth" });
              }, 300);
            }, 100);
          }
        }
      };
      onScrollRequest(scrollToInline);
    }
  }, [inlineComponent, onScrollRequest]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close saved files dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (savedFilesDropdownRef.current && !savedFilesDropdownRef.current.contains(event.target)) {
        setShowSavedFilesDropdown(false);
      }
    };

    if (showSavedFilesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSavedFilesDropdown]);

  // Fetch saved files (placeholder - can be connected to API later)
  useEffect(() => {
    const fetchSavedFiles = async () => {
      try {
        // const response = await fetch('/api/saved-files');
        // const data = await response.json();
        // setSavedFiles(data.files || []);
        setSavedFiles([]); // Placeholder
      } catch (error) {
        console.error("Error fetching saved files:", error);
      }
    };
    fetchSavedFiles();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input && input.value.trim()) {
      onSendMessage(input.value.trim());
      input.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg relative overflow-hidden">
      {/* Logo - Sticky at Top */}
      <div className="sticky top-0 z-10 bg-white px-4 py-3">
        <div className="flex items-center justify-start">
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
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 chat-scrollable bg-white">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.type === "user" ? (
              <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                <Enterprise size={20} className="text-brand-stroke-strong" />
              </div>
            ) : (
              <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                <Image
                  src="/onlylogo.svg"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-brand-bg-fill text-brand-text-strong"
                  : index === 0 && message.type === "ai"
                  ? "bg-white text-brand-text-strong"
                  : "bg-brand-bg-fill text-brand-text-strong"
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
        {typingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-brand-bg-fill text-brand-text-strong">
              {typingText}
              <span className="animate-pulse">|</span>
            </div>
          </div>
        )}
        {inlineComponent && (
          <div className="flex justify-start" data-inline-component>
            <div className="max-w-[80%] w-full">
              {inlineComponent}
            </div>
          </div>
        )}
        {isLoading && !typingText && <TypingAnimation />}
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
      <div className="border-t border-[#E5E5E5] px-4 py-4 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            placeholder="Type your message..."
            className="w-full min-h-[140px] pl-2 pr-2 py-4 bg-brand-bg-white border border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill resize-none text-base m-0 placeholder:text-brand-text-placeholder text-brand-text-strong"
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
          <div className="absolute bottom-4 left-2 flex items-center gap-2 z-10">
            {/* @ Icon for Saved Files - FIRST */}
            <div className="relative" ref={savedFilesDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowSavedFilesDropdown(!showSavedFilesDropdown);
                }}
                className="p-2 rounded-md hover:bg-brand-bg-fill transition-colors"
                disabled={isLoading}
                title="Show saved files"
              >
                <span className="text-brand-stroke-strong text-lg font-semibold">@</span>
              </button>
              {showSavedFilesDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-brand-bg-white border border-brand-stroke-weak rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {savedFiles.length > 0 ? (
                    <div className="py-2">
                      {savedFiles.map((file, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            console.log("Selected file:", file);
                            setShowSavedFilesDropdown(false);
                            // TODO: Add file to input or handle selection
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-brand-bg-fill transition-colors flex items-center gap-2"
                          style={{ fontFamily: "Open Sans, sans-serif" }}
                        >
                          <Document size={16} className="text-brand-stroke-strong" />
                          <span className="truncate">{file.name || file}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-brand-text-weak text-center" style={{ fontFamily: "Open Sans, sans-serif" }}>
                      No saved files
                    </div>
                  )}
                </div>
              )}
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
                <Document size={20} className="text-brand-stroke-strong" />
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
