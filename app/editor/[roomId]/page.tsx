import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import { getProjectForAccess } from "@/lib/project-access";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { roomId } = await params;
  const result = await getProjectForAccess(roomId);

  if (result.kind === "unauthenticated") {
    redirect("/sign-in");
  }

  if (result.kind === "denied") {
    return <AccessDenied />;
  }

  return (
    <WorkspaceShell
      project={{
        id: result.project.id,
        name: result.project.name,
        ownedByCurrentUser: result.project.ownedByCurrentUser,
        canEdit: result.project.canEdit,
      }}
    />
  );
}
