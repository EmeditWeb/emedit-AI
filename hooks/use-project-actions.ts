"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { slugify, type ProjectSummary } from "@/lib/projects";

export type DialogMode = "create" | "rename" | "delete" | null;

export interface UseProjectActionsResult {
  mode: DialogMode;
  activeProject: ProjectSummary | null;
  name: string;
  isLoading: boolean;
  roomIdPreview: string;
  openCreate: () => void;
  openRename: (project: ProjectSummary) => void;
  openDelete: (project: ProjectSummary) => void;
  setName: (value: string) => void;
  close: () => void;
  submit: () => Promise<void>;
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, "0");
}

function buildRoomId(name: string, suffix: string): string {
  const slug = slugify(name) || "project";
  return `${slug}-${suffix}`;
}

export function useProjectActions(): UseProjectActionsResult {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  const activeWorkspaceId =
    typeof params?.projectId === "string" ? params.projectId : undefined;

  const [mode, setMode] = useState<DialogMode>(null);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(
    null,
  );
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSuffix, setPendingSuffix] = useState("");

  const close = useCallback(() => {
    setMode(null);
    setActiveProject(null);
    setName("");
    setIsLoading(false);
    setPendingSuffix("");
  }, []);

  const openCreate = useCallback(() => {
    setActiveProject(null);
    setName("");
    setPendingSuffix(generateSuffix());
    setMode("create");
  }, []);

  const openRename = useCallback((project: ProjectSummary) => {
    setActiveProject(project);
    setName(project.name);
    setMode("rename");
  }, []);

  const openDelete = useCallback((project: ProjectSummary) => {
    setActiveProject(project);
    setName("");
    setMode("delete");
  }, []);

  const roomIdPreview = useMemo(() => {
    if (mode !== "create") return "";
    return buildRoomId(name, pendingSuffix);
  }, [mode, name, pendingSuffix]);

  const submit = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (mode === "create") {
        const trimmed = name.trim();
        const finalName = trimmed.length > 0 ? trimmed : "Untitled Project";
        const id = buildRoomId(finalName, pendingSuffix);
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name: finalName }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { project?: { id?: string } };
        const newId = data.project?.id ?? id;
        close();
        router.push(`/editor/${newId}`);
        return;
      }

      if (mode === "rename" && activeProject) {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;
        const res = await fetch(`/api/projects/${activeProject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) return;
        close();
        router.refresh();
        return;
      }

      if (mode === "delete" && activeProject) {
        const targetId = activeProject.id;
        const res = await fetch(`/api/projects/${targetId}`, {
          method: "DELETE",
        });
        if (!res.ok) return;
        close();
        if (activeWorkspaceId === targetId) {
          router.push("/editor");
        } else {
          router.refresh();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    mode,
    name,
    activeProject,
    isLoading,
    pendingSuffix,
    activeWorkspaceId,
    close,
    router,
  ]);

  return {
    mode,
    activeProject,
    name,
    isLoading,
    roomIdPreview,
    openCreate,
    openRename,
    openDelete,
    setName,
    close,
    submit,
  };
}
