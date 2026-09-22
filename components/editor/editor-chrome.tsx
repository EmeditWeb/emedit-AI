"use client";

import { useAuth } from "@clerk/nextjs";
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
import { useLiveInvitations } from "@/hooks/use-live-invitations";
import { useLiveProjects } from "@/hooks/use-live-projects";
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
  const liveInvitations = useLiveInvitations(invitations);
  const { owned: liveOwned, shared: liveShared } = useLiveProjects(
    owned,
    shared,
  );

  const { isLoaded, isSignedIn } = useAuth();

  const contextValue = useMemo(
    () => ({
      owned: liveOwned,
      shared: liveShared,
      invitations: liveInvitations,
      openCreate: actions.openCreate,
      openRename: actions.openRename,
      openDelete: actions.openDelete,
    }),
    [
      liveOwned,
      liveShared,
      liveInvitations,
      actions.openCreate,
      actions.openRename,
      actions.openDelete,
    ],
  );

  // If the freshly-created session isn't hydrated into the Clerk client yet,
  // show a centered loader instead of a blank page. The middleware has already
  // admitted this request, so `isSignedIn` flips true a moment later and the
  // editor mounts — no manual reload needed.
  if (!isLoaded) {
    return <AuthLoading />;
  }

  return (
    <ProjectActionsProvider value={contextValue}>
      <WorkspaceProvider>
        {isSignedIn ? (
          <ChromeFrame>{children}</ChromeFrame>
        ) : (
          <AuthLoading />
        )}
        <ProjectDialogs state={actions} />
      </WorkspaceProvider>
    </ProjectActionsProvider>
  );
}

function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div className="flex items-center gap-2 text-copy-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-copy-faint border-t-brand" />
        <span className="text-sm">Loading workspace…</span>
      </div>
    </div>
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
