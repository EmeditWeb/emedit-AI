"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ProjectSummary } from "@/lib/projects";
import type { PendingInvitation } from "@/lib/projects-data";

interface ProjectActions {
  owned: ReadonlyArray<ProjectSummary>;
  shared: ReadonlyArray<ProjectSummary>;
  invitations: ReadonlyArray<PendingInvitation>;
  openCreate: () => void;
  openRename: (project: ProjectSummary) => void;
  openDelete: (project: ProjectSummary) => void;
}

const ProjectActionsContext = createContext<ProjectActions | null>(null);

interface ProjectActionsProviderProps {
  value: ProjectActions;
  children: ReactNode;
}

export function ProjectActionsProvider({
  value,
  children,
}: ProjectActionsProviderProps) {
  return (
    <ProjectActionsContext.Provider value={value}>
      {children}
    </ProjectActionsContext.Provider>
  );
}

export function useProjectActions(): ProjectActions {
  const ctx = useContext(ProjectActionsContext);
  if (!ctx) {
    throw new Error(
      "useProjectActions must be used within a ProjectActionsProvider",
    );
  }
  return ctx;
}
