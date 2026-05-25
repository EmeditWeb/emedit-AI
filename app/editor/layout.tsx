import type { ReactNode } from "react";

import { EditorChrome } from "@/components/editor/editor-chrome";
import { getProjectsForCurrentUser } from "@/lib/projects-data";

interface EditorLayoutProps {
  children: ReactNode;
}

export default async function EditorLayout({ children }: EditorLayoutProps) {
  const { owned, shared } = await getProjectsForCurrentUser();
  return (
    <EditorChrome owned={owned} shared={shared}>
      {children}
    </EditorChrome>
  );
}
