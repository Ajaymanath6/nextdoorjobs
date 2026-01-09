"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function ChatInterface({ messages = [], onSendMessage, isLoading = false }) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
        {/* Logo and Company Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="JobsonMap"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
          <h2 className="text-base font-medium text-gray-700" style={{ fontFamily: "Open Sans, sans-serif" }}>
            JobsonMap
          </h2>
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

      {/* Input Area - Inside chat area at bottom */}
      <div className="border-t border-[#E5E5E5] px-4 py-4 bg-white relative">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            placeholder="Type your message..."
            className="w-full min-h-[140px] px-6 py-4 pr-16 bg-white border rounded-lg focus:outline-none resize-none text-base m-0"
            style={{ fontFamily: "Open Sans, sans-serif" }}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md z-20 bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
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
