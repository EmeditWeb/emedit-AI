"use client";

import { useMemo, useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectActionsProvider } from "@/components/editor/project-actions-context";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";

interface EditorChromeProps {
  children: ReactNode;
}

export function EditorChrome({ children }: EditorChromeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const projects = useProjects();

  const dialogs = useProjectDialogs({
    onCreate: projects.create,
    onRename: projects.rename,
    onDelete: projects.remove,
  }); 

  const contextValue = useMemo(
    () => ({
      owned: projects.owned,
      shared: projects.shared,
      openCreate: dialogs.openCreate,
      openRename: dialogs.openRename,
      openDelete: dialogs.openDelete,
    }),
    [
      projects.owned,
      projects.shared,
      dialogs.openCreate,
      dialogs.openRename,
      dialogs.openDelete,
    ],
  );

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <ProjectActionsProvider value={contextValue}>
      <div className="flex h-screen flex-col bg-base text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <div className="relative flex min-h-0 flex-1">
          <button
            type="button"
            aria-hidden={!isSidebarOpen}
            tabIndex={isSidebarOpen ? 0 : -1}
            aria-label="Close projects sidebar"
            onClick={closeSidebar}
            className={cn(
              "fixed inset-x-0 top-14 bottom-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden",
              isSidebarOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          />
          <ProjectSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>

        <ProjectDialogs state={dialogs} />
      </div>
    </ProjectActionsProvider>
  );
}
