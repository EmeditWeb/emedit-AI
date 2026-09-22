"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5000;

export type WorkspaceAccess =
  | { ok: true }
  | { ok: false; reason: "deleted" | "denied" };

async function checkAccess(projectId: string): Promise<WorkspaceAccess> {
  const res = await fetch(`/api/projects/${projectId}/access`, {
    cache: "no-store",
  });
  if (res.ok) {
    const data = (await res.json()) as { ok: boolean; reason?: "deleted" | "denied" };
    return data.ok
      ? { ok: true }
      : { ok: false, reason: data.reason ?? "denied" };
  }
  throw new Error("Failed to check workspace access");
}

/**
 * Polls whether the current workspace is still reachable. When the owner deletes
 * the project (or revokes access), the check flips to a non-ok state so the open
 * canvas is replaced immediately instead of lingering until a manual reload.
 */
export function useWorkspaceAccess(projectId: string): WorkspaceAccess {
  const [access, setAccess] = useState<WorkspaceAccess>({ ok: true });

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const next = await checkAccess(projectId);
        if (!cancelled) setAccess(next);
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
  }, [projectId]);

  return access;
}