import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { slugify, type ProjectSummary } from "@/lib/projects";

interface ProjectListsResult {
  owned: ProjectSummary[];
  shared: ProjectSummary[];
}

interface ProjectRow {
  id: string;
  name: string;
}

function toSummary(
  row: ProjectRow,
  ownedByCurrentUser: boolean,
): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    slug: slugify(row.name),
    ownedByCurrentUser,
  };
}

export async function getProjectsForCurrentUser(): Promise<ProjectListsResult> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [] };
  }

  const user = await currentUser();
  const emails =
    user?.emailAddresses.map((entry) => entry.emailAddress).filter(Boolean) ??
    [];

  const [ownedRows, sharedRows] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    emails.length > 0
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: { in: emails } } },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve<ProjectRow[]>([]),
  ]);

  return {
    owned: ownedRows.map((row) => toSummary(row, true)),
    shared: sharedRows.map((row) => toSummary(row, false)),
  };
}
