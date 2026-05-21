"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      data-state={isOpen ? "open" : "closed"}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-14 left-3 bottom-3 z-40 flex w-72 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out",
        isOpen
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "-translate-x-[110%] opacity-0",
      )}
    >
      <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close projects sidebar"
        >
          <X className="h-4 w-4 text-copy-secondary" />
        </Button>
      </header>

      <Tabs defaultValue="my" className="flex min-h-0 flex-1 flex-col px-3 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="my" className="flex-1">
            My Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">
            Shared
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="my"
          className="flex min-h-0 flex-1 items-center justify-center"
        >
          <EmptyState message="No projects yet" />
        </TabsContent>

        <TabsContent
          value="shared"
          className="flex min-h-0 flex-1 items-center justify-center"
        >
          <EmptyState message="Nothing shared with you" />
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-3">
        <Button variant="outline" className="w-full justify-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="px-4 py-8 text-center text-sm text-copy-muted">{message}</p>
  );
}
