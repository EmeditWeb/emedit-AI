"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useProjectActions } from "@/components/editor/project-actions-context";
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
          {shared.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState message="Nothing shared with you" />
            </div>
          ) : (
            <ProjectList projects={shared} />
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
}

function ProjectList({ projects }: ProjectListProps) {
  return (
    <ul className="flex flex-col gap-0.5 py-2">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </ul>
  );
}

interface ProjectRowProps {
  project: ProjectSummary;
}

function ProjectRow({ project }: ProjectRowProps) {
  const { openRename, openDelete } = useProjectActions();
  const { activeProject } = useWorkspace();
  const isActive = activeProject?.id === project.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  const closeMenu = () => setMenuPos(null);

  const toggleMenu = () => {
    if (menuPos) {
      closeMenu();
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 144;
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - menuWidth),
    });
  };

  return (
    <li
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 hover:bg-accent-dim",
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
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${project.name}`}
          aria-expanded={menuPos !== null}
          onClick={toggleMenu}
          className={cn(
            "opacity-0 group-hover:opacity-100 aria-expanded:opacity-100",
            menuPos && "opacity-100",
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-copy-secondary" />
        </Button>
      )}

      {menuPos && (
        <RowMenuPortal
          top={menuPos.top}
          left={menuPos.left}
          onClose={closeMenu}
          onRename={() => {
            closeMenu();
            openRename(project);
          }}
          onDelete={() => {
            closeMenu();
            openDelete(project);
          }}
        />
      )}
    </li>
  );
}

interface RowMenuPortalProps {
  top: number;
  left: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function RowMenuPortal({
  top,
  left,
  onClose,
  onRename,
  onDelete,
}: RowMenuPortalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="menu"
        style={{ top, left }}
        className="fixed z-[61] w-36 overflow-hidden rounded-md border border-surface-border bg-surface shadow-lg"
      >
        <MenuItem
          icon={<Pencil className="h-3.5 w-3.5" />}
          label="Rename"
          onClick={onRename}
        />
        <MenuItem
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label="Delete"
          destructive
          onClick={onDelete}
        />
      </div>
    </>,
    document.body,
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, destructive = false, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-accent-dim",
        destructive ? "text-destructive" : "text-copy-primary",
      )}
    >
      {icon}
      {label}
    </button>
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
