"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Crown, Loader2, Pencil, Plus, Share2, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useProjectActions } from "@/components/editor/project-actions-context";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useWorkspace } from "@/components/editor/workspace-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectSummary } from "@/lib/projects";
import type { PendingInvitation } from "@/lib/projects-data";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const { owned, shared, invitations, openCreate } = useProjectActions();

  // Shared tab shows every collaborative workspace — ones you own (and shared
  // with others) first, then the ones shared with you — with an owner badge to
  // tell the two apart.
  const sharedProjects = [
    ...owned.filter((project) => project.isShared),
    ...shared,
  ];

  return (
    <aside
      data-state={isOpen ? "open" : "closed"}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-[4.5rem] left-3 bottom-3 z-40 flex w-72 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out",
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

      <Tabs
        defaultValue={invitations.length > 0 ? "invites" : "my"}
        className="flex min-h-0 flex-1 flex-col px-3 pt-3"
      >
        <TabsList className="w-full">
          <TabsTrigger value="my" className="flex-1">
            My
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">
            Shared
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex-1 gap-1.5">
            <span>Invites</span>
            {invitations.length > 0 && (
              <span className="rounded-full bg-brand/15 px-1.5 text-[10px] font-semibold text-brand">
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="flex min-h-0 flex-1 flex-col">
          {owned.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState message="No projects yet" />
            </div>
          ) : (
            <ProjectList projects={owned} />
          )}
        </TabsContent>

        <TabsContent value="shared" className="flex min-h-0 flex-1 flex-col">
          {sharedProjects.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState message="Nothing shared yet" />
            </div>
          ) : (
            <ProjectList
              projects={sharedProjects}
              context="shared"
            />
          )}
        </TabsContent>

        <TabsContent value="invites" className="flex min-h-0 flex-1 flex-col">
          {invitations.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState message="No pending invitations" />
            </div>
          ) : (
            <InvitationList invitations={invitations} />
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-3">
        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}

interface ProjectListProps {
  projects: ReadonlyArray<ProjectSummary>;
  context?: "my" | "shared";
}

function ProjectList({ projects, context = "my" }: ProjectListProps) {
  return (
    <ul className="flex flex-col gap-0.5 py-2">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} context={context} />
      ))}
    </ul>
  );
}

interface ProjectRowProps {
  project: ProjectSummary;
  context?: "my" | "shared";
}

function ProjectRow({ project, context = "my" }: ProjectRowProps) {
  const { openRename, openDelete } = useProjectActions();
  const { activeProject } = useWorkspace();
  const isActive = activeProject?.id === project.id;
  const [isShareOpen, setIsShareOpen] = useState(false);
  const showOwnerBadge = context === "shared" && project.ownedByCurrentUser;

  return (
    <li
      className={cn(
        "group flex items-center gap-0.5 rounded-md pr-1 hover:bg-accent-dim",
        isActive && "bg-accent-dim",
      )}
    >
      <Link
        href={`/editor/${project.id}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm",
          isActive ? "text-brand" : "text-copy-primary",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
            isActive
              ? "bg-brand shadow-[0_0_8px_rgba(0,200,212,0.6)]"
              : "bg-transparent",
          )}
        />
        <span className="truncate">{project.name}</span>
      </Link>

      {project.ownedByCurrentUser && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Share ${project.name}`}
            onClick={() => setIsShareOpen(true)}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Share2 className="h-3.5 w-3.5 text-copy-secondary" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Rename ${project.name}`}
            onClick={() => openRename(project)}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5 text-copy-secondary" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${project.name}`}
            onClick={() => openDelete(project)}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 text-copy-secondary" />
          </Button>
        </>
      )}

      {showOwnerBadge && (
        <span
          title="You are the owner of this workspace"
          aria-label="You are the owner of this workspace"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand/10"
        >
          <Crown className="h-3 w-3 text-brand" strokeWidth={2} />
        </span>
      )}

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={project.id}
        projectName={project.name}
        ownedByCurrentUser={project.ownedByCurrentUser}
      />
    </li>
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

interface InvitationListProps {
  invitations: ReadonlyArray<PendingInvitation>;
}

function InvitationList({ invitations }: InvitationListProps) {
  return (
    <ul className="flex flex-col gap-2 py-2">
      {invitations.map((invite) => (
        <InvitationRow key={invite.id} invitation={invite} />
      ))}
    </ul>
  );
}

interface InvitationRowProps {
  invitation: PendingInvitation;
}

function InvitationRow({ invitation }: InvitationRowProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inviterName =
    invitation.inviter?.displayName ?? invitation.inviter?.email ?? "Someone";

  const respond = async (action: "accept" | "reject") => {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Request failed");
      }
      // Accepting seeds the user straight into the shared workspace instead of
      // dropping them back on the Invites list to open it from Shared.
      if (action === "accept") {
        router.push(`/editor/${invitation.projectId}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setPending(null);
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-md border border-surface-border/70 bg-elevated/60 p-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-copy-primary">
          {invitation.projectName}
        </span>
        <span className="truncate text-[11px] text-copy-muted">
          Invited by {inviterName}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => respond("accept")}
          disabled={pending !== null}
          className="h-7 flex-1 gap-1 bg-brand text-black hover:bg-brand/90"
        >
          {pending === "accept" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Accept
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => respond("reject")}
          disabled={pending !== null}
          className="h-7 flex-1 border border-surface-border/70 text-copy-secondary hover:text-destructive"
        >
          {pending === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Decline"
          )}
        </Button>
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </li>
  );
}
