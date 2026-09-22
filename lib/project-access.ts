import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  emails: string[];
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
  ownedByCurrentUser: boolean;
  /** Owners always edit; collaborators only when granted by the owner. */
  canEdit: boolean;
}

export type ProjectAccessResult =
  | { kind: "unauthenticated" }
  | { kind: "denied" }
  | { kind: "ok"; project: AccessibleProject };

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const emails =
    user?.emailAddresses
      .map((entry) => entry.emailAddress)
      .filter((value): value is string => Boolean(value)) ?? [];

  return { userId, emails };
}

export async function getProjectForAccess(
  projectId: string,
): Promise<ProjectAccessResult> {
  const identity = await getCurrentIdentity();
  if (!identity) return { kind: "unauthenticated" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: {
        where: { status: "ACTIVE" },
        select: { email: true, canEdit: true },
      },
    },
  });

  if (!project) return { kind: "denied" };

  const isOwner = project.ownerId === identity.userId;
  const membership = project.collaborators.find((entry) =>
    identity.emails.includes(entry.email),
  );

  if (!isOwner && !membership) return { kind: "denied" };

  return {
    kind: "ok",
    project: {
      id: project.id,
      name: project.name,
      ownerId: project.ownerId,
      ownedByCurrentUser: isOwner,
      canEdit: isOwner || Boolean(membership?.canEdit),
    },
  };
}
