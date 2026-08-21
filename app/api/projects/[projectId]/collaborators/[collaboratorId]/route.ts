import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

import { getUserIdByEmail } from "@/lib/collaborators";
import { getLiveblocksClient } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import { gateRequest } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ projectId: string; collaboratorId: string }>;
}

interface PatchBody {
  canShare?: unknown;
  canEdit?: unknown;
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`collaborators:${identity.userId}`, "mutate");
  if (denied) return denied;

  const { projectId, collaboratorId } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (body.canShare !== undefined && typeof body.canShare !== "boolean") {
    return NextResponse.json(
      { error: "`canShare` must be a boolean" },
      { status: 400 },
    );
  }
  if (body.canEdit !== undefined && typeof body.canEdit !== "boolean") {
    return NextResponse.json(
      { error: "`canEdit` must be a boolean" },
      { status: 400 },
    );
  }

  const data: { canShare?: boolean; canEdit?: boolean } = {};
  if (typeof body.canShare === "boolean") data.canShare = body.canShare;
  if (typeof body.canEdit === "boolean") data.canEdit = body.canEdit;
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Provide `canShare` and/or `canEdit`" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.ownerId !== identity.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data,
      select: {
        id: true,
        email: true,
        status: true,
        canShare: true,
        canEdit: true,
      },
    });
    // Push the new grant into the room now, so a revoked collaborator loses
    // write access on their current connection instead of at token expiry.
    if (typeof data.canEdit === "boolean") {
      await syncRoomAccess(projectId, updated.email, data.canEdit);
    }

    return NextResponse.json({ collaborator: updated });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}

async function syncRoomAccess(
  projectId: string,
  email: string,
  canEdit: boolean,
): Promise<void> {
  try {
    const collaboratorUserId = await getUserIdByEmail(email);
    if (!collaboratorUserId) return;

    const liveblocks = getLiveblocksClient();
    const room = await liveblocks.getRoom(projectId).catch(() => null);
    if (!room) return;

    await liveblocks.updateRoom(projectId, {
      usersAccesses: {
        [collaboratorUserId]: canEdit
          ? ["room:write"]
          : ["room:read", "room:presence:write"],
      },
    });
  } catch {
    // Non-fatal: the database is the source of truth and liveblocks-auth
    // re-derives access on the collaborator's next connection.
  }
}
