"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ActiveProject {
  id: string;
  name: string;
  ownedByCurrentUser: boolean;
}

interface WorkspaceContextValue {
  activeProject: ActiveProject | null;
  setActiveProject: (project: ActiveProject | null) => void;
  isAiSidebarOpen: boolean;
  toggleAiSidebar: () => void;
  closeAiSidebar: () => void;
  isProjectSidebarOpen: boolean;
  toggleProjectSidebar: () => void;
  closeProjectSidebar: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [activeProject, setActiveProject] = useState<ActiveProject | null>(
    null,
  );
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);

  const toggleAiSidebar = useCallback(() => {
    setIsAiSidebarOpen((prev) => !prev);
  }, []);

  const closeAiSidebar = useCallback(() => {
    setIsAiSidebarOpen(false);
  }, []);

  const toggleProjectSidebar = useCallback(() => {
    setIsProjectSidebarOpen((prev) => !prev);
  }, []);

  const closeProjectSidebar = useCallback(() => {
    setIsProjectSidebarOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      activeProject,
      setActiveProject,
      isAiSidebarOpen,
      toggleAiSidebar,
      closeAiSidebar,
      isProjectSidebarOpen,
      toggleProjectSidebar,
      closeProjectSidebar,
    }),
    [
      activeProject,
      isAiSidebarOpen,
      toggleAiSidebar,
      closeAiSidebar,
      isProjectSidebarOpen,
      toggleProjectSidebar,
      closeProjectSidebar,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
