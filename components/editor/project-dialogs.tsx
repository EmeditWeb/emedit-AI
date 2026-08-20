"use client";

import { type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isValidProjectName } from "@/lib/projects";
import type { UseProjectActionsResult } from "@/hooks/use-project-actions";

interface ProjectDialogsProps {
  state: UseProjectActionsResult;
}

export function ProjectDialogs({ state }: ProjectDialogsProps) {
  return (
    <>
      <CreateProjectDialog state={state} />
      <RenameProjectDialog state={state} />
      <DeleteProjectDialog state={state} />
    </>
  );
}

function CreateProjectDialog({ state }: ProjectDialogsProps) {
  const { mode, name, setName, isLoading, close, submit, roomIdPreview } =
    state;
  const open = mode === "create";
  const trimmed = name.trim();
  const isNameValid = isValidProjectName(trimmed);
  const hasUnslugifiableName = trimmed.length > 0 && !isNameValid;
  const canSubmit = isNameValid && !isLoading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    void submit();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Name your new architecture workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-copy-secondary">
              Project name
            </span>
            <Input
              autoFocus
              value={name}
              placeholder="My architecture"
              onChange={(event) => setName(event.target.value)}
              className="text-copy-primary"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-copy-secondary">
              Room ID
            </span>
            <code className="rounded-md border border-surface-border bg-base px-2 py-1.5 font-mono text-xs text-copy-muted">
              {roomIdPreview}
            </code>
            {hasUnslugifiableName ? (
              <span className="text-xs text-destructive">
                Project name must include letters or numbers.
              </span>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameProjectDialog({ state }: ProjectDialogsProps) {
  const { mode, activeProject, name, setName, isLoading, close, submit } =
    state;
  const open = mode === "rename";
  const isNameValid = isValidProjectName(name);
  const showInvalidHint = name.trim().length > 0 && !isNameValid;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNameValid || isLoading) return;
    void submit();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Renaming{" "}
            <span className="font-medium text-copy-primary">
              {activeProject?.name ?? ""}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-copy-secondary">
              Project name
            </span>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="text-copy-primary"
            />
            {showInvalidHint ? (
              <span className="text-xs text-destructive">
                Project name must include letters or numbers.
              </span>
            ) : null}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isNameValid || isLoading}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectDialog({ state }: ProjectDialogsProps) {
  const { mode, activeProject, isLoading, close, submit } = state;
  const open = mode === "delete";

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete workspace</DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-copy-primary">
              {activeProject?.name ?? "this workspace"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed text-copy-secondary">
          <p>
            <span className="font-medium text-destructive">
              Warning
            </span>{" "}
            — deleting removes the workspace permanently. Empty and pending
            canvases are gone with it, and{" "}
            <span className="font-medium text-copy-primary">
              every collaborator loses access
            </span>{" "}
            to the project. Anyone with this workspace open right now sees a
            deleted notice immediately; anyone offline simply won&apos;t find it
            in their lists.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={() => void submit()}
          >
            {isLoading ? "Deleting…" : "Delete workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
