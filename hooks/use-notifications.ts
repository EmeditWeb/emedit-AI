"use client";

import { useCallback, useEffect, useState } from "react";

import type { ClientNotification } from "@/lib/notifications";

const POLL_INTERVAL_MS = 8000;

async function fetchNotifications(): Promise<ClientNotification[]> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load notifications");
  const data = (await res.json()) as { notifications: ClientNotification[] };
  return data.notifications;
}

async function markReadRequest(id?: string): Promise<void> {
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(id ? { id } : {}),
  }).catch(() => {});
}

/**
 * Loads the current user's notifications and polls for new ones (e.g. a
 * workspace deleted by its owner while the user was signed out). Optimistically
 * flips read flags locally so the bell badge settles immediately.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const fresh = await fetchNotifications();
        if (!cancelled) setNotifications(fresh);
      } catch {
        // Transient failures are fine; the next poll retries.
      }
    };

    sync();
    const interval = window.setInterval(sync, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    await markReadRequest(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await markReadRequest();
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const unreadCount = notifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0,
  );

  return { notifications, unreadCount, markRead, markAllRead };
}