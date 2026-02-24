"use client";

import { useState, useEffect } from "react";

// Simple module-level store so multiple components share the same count and polling
let globalCount = 0;
const subscribers = new Set();
let pollingStarted = false;

const notifySubscribers = () => {
  for (const cb of subscribers) {
    try {
      cb(globalCount);
    } catch {
      // ignore subscriber errors
    }
  }
};

const fetchUnreadCount = async () => {
  try {
    const res = await fetch("/api/notifications/unread-count", {
      credentials: "same-origin",
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const next = typeof data.count === "number" ? data.count : 0;
    if (next !== globalCount) {
      globalCount = next;
      notifySubscribers();
    }
  } catch {
    // ignore network errors; will retry on next poll or refresh
  }
};

const startPollingIfNeeded = () => {
  if (pollingStarted) return;
  pollingStarted = true;
  // Initial fetch
  fetchUnreadCount();
  // Poll every 30s
  setInterval(fetchUnreadCount, 30000);
};

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(globalCount);

  useEffect(() => {
    startPollingIfNeeded();
    const subscriber = (next) => setCount(next);
    subscribers.add(subscriber);
    // Sync immediately on mount
    setCount(globalCount);
    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  const refresh = async () => {
    await fetchUnreadCount();
  };

  return { count, refresh };
}

