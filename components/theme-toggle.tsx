"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <ThemeIcon className="size-4 text-copy-secondary" />
    </Button>
  );
}