"use client";

import { Plus } from "lucide-react";

import { useProjectActions } from "@/components/editor/project-actions-context";
import { Button } from "@/components/ui/button";

export default function EditorPage() {
  const { openCreate } = useProjectActions();

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-medium text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
