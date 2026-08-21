import { auth, currentUser } from "@clerk/nextjs/server";

import { getUserProfileById } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";
import { slugify, type ProjectSummary } from "@/lib/projects";

export interface PendingInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedAt: string;
  inviter: {
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

interface ProjectListsResult {
  owned: ProjectSummary[];
  shared: ProjectSummary[];
  invitations: PendingInvitation[];
}

interface ProjectRow {
  id: string;
  name: string;
}

function toSummary(
  row: ProjectRow,
  ownedByCurrentUser: boolean,
  isShared?: boolean,
): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    slug: slugify(row.name),
    ownedByCurrentUser,
    isShared,
  };
}

export async function getProjectsForCurrentUser(): Promise<ProjectListsResult> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [], invitations: [] };
  }

  const user = await currentUser();
  const emails =
    user?.emailAddresses.map((entry) => entry.emailAddress).filter(Boolean) ??
    [];

  const [ownedRows, sharedRows, invitationRows] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            collaborators: { where: { status: "ACTIVE" } },
          },
        },
      },
    }),
    emails.length > 0
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: {
              some: { email: { in: emails }, status: "ACTIVE" },
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve<ProjectRow[]>([]),
    emails.length > 0
      ? prisma.projectCollaborator.findMany({
          where: { email: { in: emails }, status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            project: { select: { id: true, name: true, ownerId: true } },
          },
        })
      : Promise.resolve<
          {
            id: string;
            createdAt: Date;
            project: { id: string; name: string; ownerId: string };
          }[]
        >([]),
  ]);

  const inviterProfiles = await Promise.all(
    invitationRows.map((row) => getUserProfileById(row.project.ownerId)),
  );

  const invitations: PendingInvitation[] = invitationRows.map((row, index) => {
    const profile = inviterProfiles[index];
    return {
      id: row.id,
      projectId: row.project.id,
      projectName: row.project.name,
      invitedAt: row.createdAt.toISOString(),
      inviter: profile
        ? {
            displayName: profile.displayName,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
          }
        : null,
    };
  });

  return {
    owned: ownedRows.map((row) =>
      toSummary(row, true, row._count.collaborators > 0),
    ),
    shared: sharedRows.map((row) => toSummary(row, false, true)),
    invitations,
  };
}
