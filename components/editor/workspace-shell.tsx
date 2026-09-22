"use client";

import { MessageSquare, Sparkles, X } from "lucide-react";
import { useEffect } from "react";

import { Canvas } from "@/components/editor/canvas";
import {
  SmallScreenGate,
  useIsBelowMinWidth,
} from "@/components/editor/small-screen-gate";
import { WorkspaceAccessGuard } from "@/components/editor/workspace-access-guard";
import {
  useWorkspace,
  type ActiveProject,
} from "@/components/editor/workspace-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceShellProps {
  project: ActiveProject;
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const {
    setActiveProject,
    isAiSidebarOpen,
    closeAiSidebar,
    isProjectSidebarOpen,
  } = useWorkspace();
  const isBelowMinWidth = useIsBelowMinWidth();
  const isBlocked = isBelowMinWidth === true;

  useEffect(() => {
    setActiveProject(project);
    return () => setActiveProject(null);
  }, [project, setActiveProject]);

  return (
    <div className="relative h-full w-full">
      <div
        // Keyboard focus must not reach the canvas behind the gate.
        inert={isBlocked}
        className={cn(
          "h-full transition-[padding] duration-200 ease-out",
          "p-3",
          isProjectSidebarOpen && "lg:pl-[19.5rem]",
          isAiSidebarOpen && "lg:pr-[21.5rem]",
        )}
      >
        <section className="relative h-full w-full overflow-hidden rounded-2xl border border-surface-border bg-surface/40 shadow-2xl shadow-black/30">
          <WorkspaceAccessGuard projectId={project.id}>
            <Canvas roomId={project.id} canEdit={project.canEdit} />
          </WorkspaceAccessGuard>
        </section>
      </div>

      <AiSidebar isOpen={isAiSidebarOpen} onClose={closeAiSidebar} />
      <SmallScreenGate />
    </div>
  );
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      data-state={isOpen ? "open" : "closed"}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-[4.5rem] right-3 bottom-3 z-40 flex w-80 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/80 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-200 ease-out",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent",
        isOpen
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "translate-x-[110%] opacity-0",
      )}
    >
      <header className="relative flex items-center justify-between border-b border-surface-border/70 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-copy-primary">
            AI Copilot
          </h2>
          <p className="text-[0.7rem] text-copy-muted">Placeholder panel</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-ai/30 bg-ai/10">
            <Sparkles className="h-3.5 w-3.5 text-ai-text" />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI sidebar"
          >
            <X className="h-4 w-4 text-copy-secondary" />
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col gap-3 p-3">
        <div className="rounded-xl border border-surface-border/70 bg-elevated/60 p-3 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ai/30 bg-ai/10">
              <MessageSquare className="h-4 w-4 text-ai-text" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-copy-primary">
                Chat surface pending
              </p>
              <p className="text-xs leading-relaxed text-copy-muted">
                The toggle is wired. Messaging and generation are intentionally
                out of scope here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-surface-border/70 bg-base/40 p-4 backdrop-blur-md">
        <p className="text-[0.65rem] font-medium tracking-[0.25em] text-copy-faint uppercase">
          Future Hooks
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-copy-muted">
          Prompt composer, run status, and architecture guidance will attach to
          this sidebar.
        </p>
      </footer>
    </aside>
  );
}
