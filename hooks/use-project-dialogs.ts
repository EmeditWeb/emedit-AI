"use client";

import { useCallback, useState } from "react";

import type { MockProject } from "@/lib/projects";

export type DialogMode = "create" | "rename" | "delete" | null;

interface ProjectDialogHandlers {
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

interface UseProjectDialogsResult {
  mode: DialogMode;
  activeProject: MockProject | null;
  name: string;
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: MockProject) => void;
  openDelete: (project: MockProject) => void;
  setName: (value: string) => void;
  close: () => void;
  submit: () => Promise<void>;
}

export function useProjectDialogs(
  handlers: ProjectDialogHandlers,
): UseProjectDialogsResult {
  const [mode, setMode] = useState<DialogMode>(null);
  const [activeProject, setActiveProject] = useState<MockProject | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const close = useCallback(() => {
    setMode(null);
    setActiveProject(null);
    setName("");
    setIsLoading(false);
  }, []);

  const openCreate = useCallback(() => {
    setActiveProject(null);
    setName("");
    setMode("create");
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setActiveProject(project);
    setName(project.name);
    setMode("rename");
  }, []);

  const openDelete = useCallback((project: MockProject) => {
    setActiveProject(project);
    setName("");
    setMode("delete");
  }, []);

  const submit = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (mode === "create") {
      handlers.onCreate(name);
    } else if (mode === "rename" && activeProject) {
      handlers.onRename(activeProject.id, name);
    } else if (mode === "delete" && activeProject) {
      handlers.onDelete(activeProject.id);
    }

    setIsLoading(false);
    setMode(null);
    setActiveProject(null);
    setName("");
  }, [mode, activeProject, name, handlers]);

  return {
    mode,
    activeProject,
    name,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    setName,
    close,
    submit,
  };
}
