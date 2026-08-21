"use client";

import { useEffect, useState } from "react";

import type { PendingInvitation } from "@/lib/projects-data";

const POLL_INTERVAL_MS = 5000;

async function fetchInvitations(): Promise<Array<PendingInvitation>> {
  const res = await fetch("/api/invitations", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load invitations");
  const data = (await res.json()) as { invitations: PendingInvitation[] };
  return data.invitations;
}

/**
 * Keeps the Invites tab in sync without a page reload: adopts the server-provided
 * list and re-polls for new invitations while the editor is open, so a fresh
 * invite appears as soon as it lands instead of only after a manual refresh.
 */
export function useLiveInvitations(
  initial: ReadonlyArray<PendingInvitation>,
): Array<PendingInvitation> {
  const [invitations, setInvitations] = useState<Array<PendingInvitation>>(
    () => Array.from(initial ?? []),
  );

  // Adopt server-side changes (e.g. after an accept/decline triggers a
  // router.refresh()) so the list reflects the shared source of truth too.
  // Adjusting state during render (not in an effect) is React's recommended way
  // to mirror a changing prop into state without redundant render passes.
  const [lastInitial, setLastInitial] = useState(initial);
  if (lastInitial !== initial) {
    setLastInitial(initial);
    setInvitations(Array.from(initial ?? []));
  }

  // Poll for invitations that land while the editor is open — the server layout
  // only re-fetches on navigation/refresh, so this is what makes a fresh invite
  // show up in the tab without reloading the page.
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const fresh = await fetchInvitations();
        if (!cancelled) setInvitations(fresh);
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

  return invitations;
}