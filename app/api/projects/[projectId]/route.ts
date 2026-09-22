import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserIdByEmail } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";
import { getLiveblocksClient } from "@/lib/liveblocks";
import { gateRequest } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface UpdateProjectBody {
  name?: unknown;
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`projects:${userId}`, "mutate");
  if (denied) return denied;

  const { projectId } = await ctx.params;

  let body: UpdateProjectBody;
  try {
    body = (await request.json()) as UpdateProjectBody;
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON" },
      { status: 400 },
    );
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (rawName.length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: rawName },
  });

  revalidatePath("/editor", "layout");
  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`projects:${userId}`, "mutate");
  if (denied) return denied;

  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      name: true,
      collaborators: {
        where: { status: "ACTIVE" },
        select: { email: true },
      },
    },
  });

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Leave a "workspace deleted" notification for every active collaborator so
  // they learn about it the next time they sign in — not just those with the
  // workspace open right now. Best effort: a notification failure must never
  // block the deletion itself.
  try {
    const recipients = new Set<string>();
    for (const collaborator of project.collaborators) {
      if (!collaborator.email) continue;
      const recipientId = await getUserIdByEmail(collaborator.email);
      if (recipientId && recipientId !== project.ownerId) {
        recipients.add(recipientId);
      }
    }
    await prisma.projectNotification.createMany({
      data: Array.from(recipients).map((recipientId) => ({
        userId: recipientId,
        projectId,
        projectName: project.name,
        type: "PROJECT_DELETED",
      })),
    });
  } catch {
    // Notification creation is best-effort.
  }

  await prisma.project.delete({ where: { id: projectId } });

  // Tear down the collaboration room so connected collaborators lose their live
  // connection too (their open canvas then flips to the deleted notice). Best
  // effort — a Liveblocks outage must not block the project deletion itself.
  try {
    await getLiveblocksClient().deleteRoom(projectId);
  } catch {
    // Room cleanup is best-effort; the DB row is already gone.
  }

  revalidatePath("/editor", "layout");
  return NextResponse.json({ success: true });
}
