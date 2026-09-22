"use client";

import { Bell, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

function timeAgo(iso: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsButton() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unread = notifications.filter((notification) => !notification.read);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={open ? "Close notifications" : "Notifications"}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl shadow-black/40 backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-surface-border/70 px-3 py-2.5">
            <span className="text-sm font-medium text-copy-primary">
              Notifications
            </span>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] text-brand"
              >
                Mark all read
              </button>
            )}
          </header>

          <div className="no-scrollbar max-h-80 overflow-y-auto">
            {unread.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-copy-muted">
                No notifications
              </p>
            ) : (
              unread.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void markRead(notification.id)}
                  className="flex w-full items-start gap-2.5 border-b border-surface-border/50 bg-brand/[0.04] px-3 py-2.5 text-left hover:bg-accent-dim"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-xs leading-snug text-copy-primary">
                      <span className="font-medium">Workspace deleted</span> —{" "}
                      &ldquo;{notification.projectName}&rdquo; was removed by
                      its owner.
                    </span>
                    <span className="text-[10px] text-copy-faint">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </span>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}