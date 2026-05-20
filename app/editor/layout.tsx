import type { ReactNode } from "react";

import { EditorChrome } from "@/components/editor/editor-chrome";

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return <EditorChrome>{children}</EditorChrome>;
}
