"use client";

import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useProjectActions } from "@/components/editor/project-actions-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MockProject } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const { owned, shared, openCreate } = useProjectActions();

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
  projects: ReadonlyArray<MockProject>;
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
  project: MockProject;
}

function ProjectRow({ project }: ProjectRowProps) {
  const { openRename, openDelete } = useProjectActions();
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
    <li className="group flex items-center gap-1 rounded-md pr-1 hover:bg-accent-dim">
      <button
        type="button"
        className="flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm text-copy-primary"
      >
        <span className="truncate">{project.name}</span>
      </button>

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
