"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { ReactNode } from "react";

import { useTheme } from "@/components/theme";

const variables = {
  colorBackground: "var(--bg-base)",
  colorInput: "var(--bg-surface)",
  colorInputForeground: "var(--text-primary)",
  colorForeground: "var(--text-primary)",
  colorMutedForeground: "var(--text-muted)",
  colorPrimary: "var(--accent-primary)",
  colorPrimaryForeground: "var(--bg-base)",
  colorBorder: "var(--border-default)",
  colorNeutral: "var(--text-primary)",
  colorDanger: "var(--state-error)",
  colorSuccess: "var(--state-success)",
  colorWarning: "var(--state-warning)",
  fontFamily: "var(--font-geist-sans)",
} as const;

/**
 * Renders Clerk's provider with an appearance that follows the app theme.
 * `dark` is applied only when the theme is dark; in light mode Clerk falls back
 * to its default light theme. The `variables` are `var(...)` references so they
 * resolve against the current `html.dark`/`html.light` token set.
 */
export function ThemedClerkAppearance({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <ClerkProvider
      appearance={{
        theme: theme === "dark" ? dark : undefined,
        variables,
      }}
    >
      {children}
    </ClerkProvider>
  );
}