import type { ReactNode } from "react";

import { EditorChrome } from "@/components/editor/editor-chrome";
import { getProjectsForCurrentUser } from "@/lib/projects-data";
import type { PendingInvitation } from "@/lib/projects-data";
import type { ProjectSummary } from "@/lib/projects";

interface EditorLayoutProps {
  children: ReactNode;
}

export default async function EditorLayout({ children }: EditorLayoutProps) {
  let lists: {
    owned: ProjectSummary[];
    shared: ProjectSummary[];
    invitations: PendingInvitation[];
  } = { owned: [], shared: [], invitations: [] };
  try {
    // Right after a credentials sign-in the very first RSC navigation can race
    // the freshly-committed session cookie. Don't let that take the whole layout
    // down (blank screen) — fall back to empty lists; the client-side live hooks
    // hydrate them moments later.
    lists = await getProjectsForCurrentUser();
  } catch {
    // Best-effort: transient auth/data failures poll in once live hooks connect.
  }
  return (
    <EditorChrome
      owned={lists.owned}
      shared={lists.shared}
      invitations={lists.invitations}
    >
      {children}
    </EditorChrome>
  );
}
