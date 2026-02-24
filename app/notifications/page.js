"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@carbon/icons-react";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const sanitizeNotificationMessage = (raw) => {
    if (!raw) return "";
    const lower = raw.toLowerCase();
    if (lower.includes("snehal is my god- ajay verse1101")) {
      return "New message received";
    }
    return raw;
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setNotificationCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ notificationIds: [notif.id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));

      // If notification has conversationId, deep-link to onboarding chat
      if (notif.conversationId) {
        router.push(`/onboarding?openNotifications=1&conversationId=${notif.conversationId}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-brand-text-strong"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-brand-text-strong">Notifications</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {loading ? (
          <p className="text-sm text-brand-text-weak">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-brand-text-weak">No notifications yet.</p>
        ) : (
          <ul className="space-y-2 max-w-3xl mx-auto">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`flex flex-col gap-1 p-4 rounded-lg border border-[#E5E5E5] hover:bg-gray-50 cursor-pointer ${
                  !notif.isRead ? "bg-brand/5 border-brand/20" : ""
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium text-brand-text-strong">{notif.title}</span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 bg-brand rounded-full shrink-0 mt-1"></span>
                  )}
                </div>
                <span className="text-sm text-brand-text-weak">
                  {sanitizeNotificationMessage(notif.message)}
                </span>
                {notif.senderOrgName && (
                  <span className="text-xs text-brand-text-weak">From: {notif.senderOrgName}</span>
                )}
                {notif.senderEmail && (
                  <span className="text-xs text-brand-text-weak">Email: {notif.senderEmail}</span>
                )}
                <span className="text-xs text-brand-text-weak">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
