"use client";

import { useCallback, useState } from "react";

import {
  mockProjects,
  mockSharedProjects,
  slugify,
  type MockProject,
} from "@/lib/projects";

function buildSlug(trimmed: string): string | null {
  const slug = slugify(trimmed);
  return slug.length > 0 ? slug : null;
}

interface UseProjectsResult {
  owned: ReadonlyArray<MockProject>;
  shared: ReadonlyArray<MockProject>;
  create: (name: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
}

export function useProjects(): UseProjectsResult {
  const [owned, setOwned] = useState<MockProject[]>(mockProjects);
  const [shared] = useState<MockProject[]>(mockSharedProjects);

  const create = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = buildSlug(trimmed);
    if (!slug) return;
    const project: MockProject = {
      id: `p_${crypto.randomUUID()}`,
      name: trimmed,
      slug,
      ownedByCurrentUser: true,
    };
    setOwned((prev) => [...prev, project]);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = buildSlug(trimmed);
    if (!slug) return;
    setOwned((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed, slug } : p)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setOwned((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { owned, shared, create, rename, remove };
}
