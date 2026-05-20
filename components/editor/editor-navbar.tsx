"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border bg-base px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
        >
          <ToggleIcon className="h-5 w-5 text-copy-secondary" />
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center" />

      <div className="flex items-center gap-2" />
    </header>
  );
}
