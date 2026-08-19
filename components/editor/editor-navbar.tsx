"use client";

import { UserButton } from "@clerk/nextjs";
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { ShareDialog } from "@/components/editor/share-dialog";
import { useWorkspace } from "@/components/editor/workspace-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorNavbar() {
  const {
    activeProject,
    isAiSidebarOpen,
    toggleAiSidebar,
    isProjectSidebarOpen,
    toggleProjectSidebar,
    openStarterTemplates,
  } = useWorkspace();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const ToggleIcon = isProjectSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-base/80 px-3 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleProjectSidebar}
          aria-label={isProjectSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isProjectSidebarOpen}
        >
          <ToggleIcon className="h-5 w-5 text-copy-secondary" />
        </Button>

        {activeProject && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className="truncate text-sm font-semibold text-copy-primary"
              title={activeProject.name}
            >
              {activeProject.name}
            </span>
            <span className="text-[0.7rem] text-copy-muted">Workspace</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeProject?.canEdit && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={openStarterTemplates}
              className="gap-1.5 border border-surface-border/70 bg-surface/50 backdrop-blur-md"
              aria-label="Open starter templates"
            >
              <LayoutTemplate className="h-3.5 w-3.5 text-copy-secondary" />
              <span className="text-copy-primary">Templates</span>
            </Button>
          </>
        )}
        {activeProject && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="gap-1.5 border border-surface-border/70 bg-surface/50 backdrop-blur-md"
              aria-label="Share project"
            >
              <Share2 className="h-3.5 w-3.5 text-copy-secondary" />
              <span className="text-copy-primary">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAiSidebar}
              aria-pressed={isAiSidebarOpen}
              aria-label={
                isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
              }
              className={cn(
                "gap-1.5 border backdrop-blur-md transition-colors",
                isAiSidebarOpen
                  ? "border-ai/40 bg-ai/15 text-ai-text shadow-[0_0_20px_rgba(100,87,249,0.25)]"
                  : "border-ai/25 bg-ai/10 text-ai-text hover:bg-ai/15",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI</span>
            </Button>
          </>
        )}
        <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
      </div>

      {activeProject && (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          projectId={activeProject.id}
          projectName={activeProject.name}
          ownedByCurrentUser={activeProject.ownedByCurrentUser}
        />
      )}
    </header>
  );
}
