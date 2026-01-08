"use client";

import { useEffect, useRef } from "react";

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
          <div className="w-6 h-6 bg-[#7c00ff] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">ND</span>
          </div>
          <h2 className="text-base font-medium text-gray-700" style={{ fontFamily: "Open Sans, sans-serif" }}>
            NextDoorJobs
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
                  ? "bg-[#7c00ff] text-white"
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

      {/* Input Area */}
      <div className="border-t border-[#E5E5E5] px-4 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c00ff] bg-white text-gray-900"
            style={{ fontFamily: "Open Sans, sans-serif", fontSize: "16px" }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#7c00ff] text-white rounded-lg hover:bg-[#6a00e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
