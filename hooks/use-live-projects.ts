"use client";

import { useEffect, useState } from "react";

import type { ProjectSummary } from "@/lib/projects";

const POLL_INTERVAL_MS = 8000;

async function fetchProjectsSummary(): Promise<{
  owned: ProjectSummary[];
  shared: ProjectSummary[];
}> {
  const res = await fetch("/api/projects/summary", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load projects");
  return (await res.json()) as {
    owned: ProjectSummary[];
    shared: ProjectSummary[];
  };
}

/**
 * Keeps the My/Shared tabs in sync without a reload: adopts the server-provided
 * lists and re-polls for changes (e.g. a newly shared workspace appearing under
 * Shared for its owner, or a shared-with-you workspace landing after acceptance)
 * while the editor is open.
 */
export function useLiveProjects(
  initialOwned: ReadonlyArray<ProjectSummary>,
  initialShared: ReadonlyArray<ProjectSummary>,
): { owned: ProjectSummary[]; shared: ProjectSummary[] } {
  const [owned, setOwned] = useState<ProjectSummary[]>(() =>
    Array.from(initialOwned ?? []),
  );
  const [shared, setShared] = useState<ProjectSummary[]>(() =>
    Array.from(initialShared ?? []),
  );

  // Adopt server-side changes (router.refresh after create/rename/delete/share)
  // — adjusting state during render is React's recommended way to mirror a
  // changing prop into state without redundant render passes.
  const [lastOwned, setLastOwned] = useState(initialOwned);
  const [lastShared, setLastShared] = useState(initialShared);
  if (lastOwned !== initialOwned) {
    setLastOwned(initialOwned);
    setOwned(Array.from(initialOwned ?? []));
  }
  if (lastShared !== initialShared) {
    setLastShared(initialShared);
    setShared(Array.from(initialShared ?? []));
  }

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const fresh = await fetchProjectsSummary();
        if (!cancelled) {
          setOwned(fresh.owned);
          setShared(fresh.shared);
        }
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

  return { owned, shared };
}