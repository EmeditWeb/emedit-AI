"use client";

import { useMemo, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectActionsProvider } from "@/components/editor/project-actions-context";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/editor/workspace-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectSummary } from "@/lib/projects";
import type { PendingInvitation } from "@/lib/projects-data";
import { cn } from "@/lib/utils";

interface EditorChromeProps {
  owned: ReadonlyArray<ProjectSummary>;
  shared: ReadonlyArray<ProjectSummary>;
  invitations: ReadonlyArray<PendingInvitation>;
  children: ReactNode;
}

export function EditorChrome({
  owned,
  shared,
  invitations,
  children,
}: EditorChromeProps) {
  const actions = useProjectActions();

  const contextValue = useMemo(
    () => ({
      owned,
      shared,
      invitations,
      openCreate: actions.openCreate,
      openRename: actions.openRename,
      openDelete: actions.openDelete,
    }),
    [
      owned,
      shared,
      invitations,
      actions.openCreate,
      actions.openRename,
      actions.openDelete,
    ],
  );

  return (
    <ProjectActionsProvider value={contextValue}>
      <WorkspaceProvider>
        <ChromeFrame>{children}</ChromeFrame>
        <ProjectDialogs state={actions} />
      </WorkspaceProvider>
    </ProjectActionsProvider>
  );
}

function ChromeFrame({ children }: { children: ReactNode }) {
  const { isProjectSidebarOpen, closeProjectSidebar } = useWorkspace();

  return (
    <div className="flex h-screen flex-col bg-base text-copy-primary">
      <EditorNavbar />

      <div className="relative flex min-h-0 flex-1">
        <button
          type="button"
          aria-hidden={!isProjectSidebarOpen}
          tabIndex={isProjectSidebarOpen ? 0 : -1}
          aria-label="Close projects sidebar"
          onClick={closeProjectSidebar}
          className={cn(
            "fixed inset-x-0 top-[4.5rem] bottom-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden",
            isProjectSidebarOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />
        <ProjectSidebar
          isOpen={isProjectSidebarOpen}
          onClose={closeProjectSidebar}
        />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
