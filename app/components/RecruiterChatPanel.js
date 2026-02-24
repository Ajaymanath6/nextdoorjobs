"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "@carbon/icons-react";

export default function RecruiterChatPanel({
  conversationId,
  otherPartyName,
  otherPartyEmail,
  otherPartyCompanyName,
  onClose,
  onNotificationCountChange,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [meUserId, setMeUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch current user for isMe check
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.user?.id) setMeUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetch(`/api/chat/conversations/${conversationId}/messages`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        const list = data.messages || [];
        setMessages([...list].reverse());
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SSE for real-time updates
  useEffect(() => {
    if (!conversationId || !meUserId) return;
    const eventSource = new EventSource(`/api/chat/socket?conversationId=${conversationId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.senderId !== meUserId) {
          setMessages((prev) => [...prev, message]);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [conversationId, meUserId]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || !conversationId || sending) return;

    setSending(true);
    setInputValue("");
    try {
      const r = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body: text }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.id) {
        setMessages((prev) => [
          ...prev,
          { id: d.id, senderId: d.senderId, body: d.body, createdAt: d.createdAt },
        ]);
      } else {
        setInputValue(text);
        alert(d.error || "Failed to send message");
      }
    } catch (err) {
      setInputValue(text);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Refresh notification count when closing (in case we read some)
  const handleClose = () => {
    if (typeof onNotificationCountChange === "function") {
      onNotificationCountChange();
    }
    onClose();
  };

  const initials = (otherPartyName || "R")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-[#E5E5E5] px-4 py-2 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0 text-brand-text-strong"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="h-9 w-9 rounded-full bg-brand-bg-fill border border-brand-stroke-weak flex items-center justify-center text-brand-text-strong font-medium text-sm shrink-0"
          aria-hidden
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-brand-text-strong truncate">
            {otherPartyName || "Recruiter"}
          </h2>
          {otherPartyEmail && (
            <span className="text-xs text-brand-text-weak truncate">{otherPartyEmail}</span>
          )}
        </div>
        {otherPartyCompanyName && (
          <div className="shrink-0 text-right ml-2">
            <span className="text-xs font-medium text-brand-text-strong">{otherPartyCompanyName}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-brand-text-weak">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-brand-text-weak">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === meUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg ${
                    isMe
                      ? "bg-brand-bg-fill text-brand-text-strong border border-brand-stroke-weak"
                      : "bg-brand-bg-fill text-brand-text-strong border border-brand-stroke-weak"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <span className="text-xs mt-1 block text-brand-text-weak">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[#E5E5E5] px-4 py-3 flex gap-2"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-brand-stroke-weak rounded-lg text-brand-text-strong placeholder:text-brand-text-placeholder focus:outline-none focus:border-brand"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
