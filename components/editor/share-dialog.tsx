"use client";

import {
  Check,
  Clock,
  Link2,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OwnerProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CollaboratorRow {
  id: string;
  email: string;
  status: "PENDING" | "ACTIVE";
  canShare: boolean;
  canEdit: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  ownedByCurrentUser: boolean;
}

interface ApiError {
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  ownedByCurrentUser,
}: ShareDialogProps) {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);
  const [callerCanShare, setCallerCanShare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState("");
  // New invites default to view-only; the owner opts into edit explicitly.
  const [inviteCanEdit, setInviteCanEdit] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [busyCollaboratorId, setBusyCollaboratorId] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Adopt the dialog's open state into the loading flag during render (rather
  // than a synchronous setState inside an effect) so a fresh fetch shows the
  // spinner. The effect itself only calls an async loader.
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setIsLoading(true);
      setLoadError(null);
    }
  }

  const requestCollaborators = useCallback(
    async () =>
      fetch(`/api/projects/${projectId}/collaborators`, { cache: "no-store" }),
    [projectId],
  );

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      try {
        const res = await requestCollaborators();
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ApiError;
          throw new Error(data.error ?? "Failed to load collaborators");
        }
        const data = (await res.json()) as {
          owner: OwnerProfile | null;
          collaborators: CollaboratorRow[];
          canShare: boolean;
          canEdit: boolean;
        };
        setOwner(data.owner);
        setCollaborators(data.collaborators);
        setCallerCanShare(data.canShare);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load collaborators",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [open, requestCollaborators]);

  // Keep membership live so a PENDING invite that the other party accepts flips
  // to ACTIVE (and their role badge updates) without a reload.
  useEffect(() => {
    if (!open) return;
    const run = async () => {
      try {
        const res = await requestCollaborators();
        if (!res.ok) return;
        const data = (await res.json()) as {
          owner: OwnerProfile | null;
          collaborators: CollaboratorRow[];
          canShare: boolean;
          canEdit: boolean;
        };
        setOwner(data.owner);
        setCollaborators(data.collaborators);
        setCallerCanShare(data.canShare);
      } catch {
        // Silent refresh — the next poll retries.
      }
    };
    const id = window.setInterval(() => void run(), 5000);
    return () => window.clearInterval(id);
  }, [open, requestCollaborators]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setEmailInput("");
        setInviteCanEdit(false);
        setInviteError(null);
        setCopied(false);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleInvite = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const email = emailInput.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(email)) {
        setInviteError("Enter a valid email address");
        return;
      }
      setInviteError(null);
      setIsInviting(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, canEdit: inviteCanEdit }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ApiError;
          throw new Error(data.error ?? "Failed to invite collaborator");
        }
        const data = (await res.json()) as {
          collaborator: CollaboratorRow;
        };
        setCollaborators((prev) => {
          if (prev.some((c) => c.email === data.collaborator.email)) {
            return prev;
          }
          return [...prev, data.collaborator];
        });
        setEmailInput("");
        setInviteCanEdit(false);
      } catch (error) {
        setInviteError(
          error instanceof Error ? error.message : "Failed to invite",
        );
      } finally {
        setIsInviting(false);
      }
    },
    [emailInput, inviteCanEdit, projectId],
  );

  
  const handleRemove = useCallback(
    async (row: CollaboratorRow) => {
      setBusyCollaboratorId(row.id);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: row.email }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ApiError;
          throw new Error(data.error ?? "Failed to remove collaborator");
        }
        setCollaborators((prev) => prev.filter((c) => c.id !== row.id));
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to remove",
        );
      } finally {
        setBusyCollaboratorId(null);
      }
    },
    [projectId],
  );

  const patchPermission = useCallback(
    async (row: CollaboratorRow, patch: { canShare?: boolean; canEdit?: boolean }) => {
      setBusyCollaboratorId(row.id);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators/${row.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          },
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ApiError;
          throw new Error(data.error ?? "Failed to update permission");
        }
        const data = (await res.json()) as {
          collaborator: { id: string; canShare: boolean; canEdit: boolean };
        };
        setCollaborators((prev) =>
          prev.map((c) =>
            c.id === data.collaborator.id
              ? {
                  ...c,
                  canShare: data.collaborator.canShare,
                  canEdit: data.collaborator.canEdit,
                }
              : c,
          ),
        );
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to update permission",
        );
      } finally {
        setBusyCollaboratorId(null);
      }
    },
    [projectId],
  );

  const handleCopyLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/editor/${projectId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard may be unavailable in some browsers
    }
  }, [projectId]);

  const showInviteUI = ownedByCurrentUser || callerCanShare;
  const totalPeople = (owner ? 1 : 0) + collaborators.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] gap-5 overflow-hidden border border-surface-border/80 bg-elevated sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[17px] font-semibold tracking-tight text-copy-primary">
            Share project
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-copy-muted">
            Invite collaborators, copy the workspace link, and manage access
            to{" "}
            <b>{projectName}</b>.
          </DialogDescription>
        </DialogHeader>

        <section className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-surface-border/70 bg-surface/60 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[13px] font-semibold text-copy-primary">
              Workspace link
            </p>
            <p className="truncate text-[11.5px] leading-snug text-copy-muted">
              Share a direct link with teammates after you grant them access.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            aria-label="Copy workspace link"
            className={cn(
              "gap-1.5 border border-surface-border/80 bg-elevated text-copy-primary transition-colors duration-150",
              copied && "border-brand/40 bg-brand/10 text-brand",
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </Button>
        </section>

        {showInviteUI ? (
          <form
            onSubmit={handleInvite}
            className="flex w-full min-w-0 flex-col gap-1.5"
          >
            <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-surface-border/70 bg-surface/60 p-1.5 transition-colors duration-150 focus-within:border-brand/40">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                <Mail className="h-4 w-4 shrink-0 text-copy-muted" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="collaborator@example.com"
                  aria-label="Collaborator email"
                  disabled={isInviting}
                  className="h-8 w-full min-w-0 bg-transparent text-sm text-copy-primary outline-none placeholder:text-copy-faint disabled:opacity-50"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isInviting}
                className="bg-brand text-black hover:bg-brand/90 focus-visible:ring-brand/30"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>
            {ownedByCurrentUser && (
              <div className="flex items-center gap-1.5 px-0.5">
                <span className="text-[11.5px] text-copy-muted">
                  Invite as
                </span>
                <div className="flex overflow-hidden rounded-lg border border-surface-border">
                  <RoleOption
                    label="Can view"
                    selected={!inviteCanEdit}
                    onSelect={() => setInviteCanEdit(false)}
                  />
                  <RoleOption
                    label="Can edit"
                    selected={inviteCanEdit}
                    onSelect={() => setInviteCanEdit(true)}
                  />
                </div>
              </div>
            )}
            {inviteError && (
              <p className="px-2 text-xs text-destructive">{inviteError}</p>
            )}
          </form>
        ) : (
          <p className="rounded-xl border border-dashed border-surface-border bg-surface/40 px-3 py-2.5 text-[11.5px] text-copy-muted">
            Only the owner can invite collaborators. Ask them to grant you share
            access if you need to invite others.
          </p>
        )}

        <section className="flex w-full min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[13px] font-semibold text-copy-primary">
              People with access
            </p>
            <span className="text-[11.5px] text-copy-faint">
              {totalPeople} total
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : loadError ? (
            <p className="px-2 text-xs text-destructive">{loadError}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {owner && (
                <PersonRow
                  displayName={owner.displayName}
                  email={owner.email}
                  avatarUrl={owner.avatarUrl}
                  badge="OWNER"
                  badgeTone="brand"
                />
              )}
              {collaborators.map((collaborator) => {
                const isBusy = busyCollaboratorId === collaborator.id;
                return (
                  <PersonRow
                    key={collaborator.id}
                    displayName={collaborator.displayName}
                    email={collaborator.email}
                    avatarUrl={collaborator.avatarUrl}
                    badge={
                      collaborator.status === "PENDING"
                        ? "PENDING"
                        : collaborator.canEdit
                          ? "CAN EDIT"
                          : "VIEW ONLY"
                    }
                    badgeTone={
                      collaborator.status === "PENDING" ||
                      !collaborator.canEdit
                        ? "muted"
                        : "brand"
                    }
                  >
                    {ownedByCurrentUser && (
                      <>
                        {collaborator.status === "ACTIVE" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              patchPermission(collaborator, {
                                canEdit: !collaborator.canEdit,
                              })
                            }
                            disabled={isBusy}
                            aria-label={
                              collaborator.canEdit
                                ? `Revoke edit access from ${collaborator.email}`
                                : `Grant edit access to ${collaborator.email}`
                            }
                            title={
                              collaborator.canEdit
                                ? "Revoke edit access"
                                : "Grant edit access"
                            }
                            className={cn(
                              collaborator.canEdit
                                ? "text-brand"
                                : "text-copy-muted hover:text-copy-primary",
                            )}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {collaborator.status === "ACTIVE" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              patchPermission(collaborator, {
                                canShare: !collaborator.canShare,
                              })
                            }
                            disabled={isBusy}
                            aria-label={
                              collaborator.canShare
                                ? `Revoke share permission from ${collaborator.email}`
                                : `Grant share permission to ${collaborator.email}`
                            }
                            title={
                              collaborator.canShare
                                ? "Revoke share permission"
                                : "Grant share permission"
                            }
                            className={cn(
                              collaborator.canShare
                                ? "text-brand"
                                : "text-copy-muted hover:text-copy-primary",
                            )}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemove(collaborator)}
                          disabled={isBusy}
                          aria-label={`Remove ${collaborator.email}`}
                          className="text-copy-muted hover:text-destructive"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </PersonRow>
                );
              })}
              {!owner && collaborators.length === 0 && (
                <li className="rounded-xl border border-dashed border-surface-border bg-surface/40 px-3 py-4 text-center text-xs text-copy-muted">
                  No collaborators yet.
                </li>
              )}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

interface PersonRowProps {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  badge?: string;
  badgeTone?: "brand" | "muted";
  children?: React.ReactNode;
}

function PersonRow({
  displayName,
  email,
  avatarUrl,
  badge,
  badgeTone = "brand",
  children,
}: PersonRowProps) {
  const shown = displayName ?? email;
  const showSecondary = Boolean(displayName);

  return (
    <li className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-surface-border/70 bg-surface/60 px-3 py-2.5">
      <Avatar displayName={displayName} email={email} avatarUrl={avatarUrl} />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[13.5px] font-semibold text-copy-primary">
          {shown}
        </span>
        {showSecondary && (
          <span className="truncate text-[11.5px] text-copy-muted">
            {email}
          </span>
        )}
      </div>
      {badge && <Badge tone={badgeTone} label={badge} />}
      {children}
    </li>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "brand" | "muted";
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        tone === "brand"
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-surface-border bg-surface/60 text-copy-muted",
      )}
    >
      {tone === "muted" && <Clock className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

function Avatar({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}) {
  const initial = (displayName ?? email).trim().charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-surface-border/70"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface text-xs font-semibold text-copy-primary">
      {initial}
    </div>
  );
}

interface RoleOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RoleOption({ label, selected, onSelect }: RoleOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "px-2.5 py-1 text-[11.5px] transition-colors",
        selected
          ? "bg-brand text-black"
          : "bg-transparent text-copy-muted hover:text-copy-primary",
      )}
    >
      {label}
    </button>
  );
}
