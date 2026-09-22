"use client";

import Link from "next/link";
import { Lock, Trash2 } from "lucide-react";
import { type ReactNode } from "react";

import { useWorkspaceAccess } from "@/hooks/use-workspace-access";
import { Button } from "@/components/ui/button";

interface WorkspaceAccessGuardProps {
  projectId: string;
  children: ReactNode;
}

/**
 * Replaces the open canvas the moment the current user loses access to the
 * workspace (owner deleted it, or revoked the membership) — no reload needed.
 */
export function WorkspaceAccessGuard({
  projectId,
  children,
}: WorkspaceAccessGuardProps) {
  const access = useWorkspaceAccess(projectId);

  if (access.ok) {
    return <>{children}</>;
  }

  const deleted = access.reason === "deleted";
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface">
          {deleted ? (
            <Trash2 className="h-6 w-6 text-destructive" />
          ) : (
            <Lock className="h-6 w-6 text-copy-secondary" />
          )}
        </div>
        <h1 className="text-xl font-medium text-copy-primary">
          {deleted
            ? "This workspace was deleted by its owner"
            : "You don't have access to this project"}
        </h1>
        <p className="text-sm text-copy-muted">
          {deleted
            ? "The workspace and its contents have been removed. This page now reflects that immediately."
            : "It may have been deleted, or its owner hasn't shared it with you."}
        </p>
        <Button asChild variant="outline">
          <Link href="/editor">Back to projects</Link>
        </Button>
      </div>
    </div>
  );
}