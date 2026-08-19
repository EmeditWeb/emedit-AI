import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ invitationId: string }>;
}

interface ActionBody {
  action?: unknown;
}

export async function POST(request: Request, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invitationId } = await ctx.params;

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json(
      { error: "`action` must be \"accept\" or \"reject\"" },
      { status: 400 },
    );
  }

  const invitation = await prisma.projectCollaborator.findUnique({
    where: { id: invitationId },
    select: { id: true, email: true, status: true, projectId: true },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!identity.emails.includes(invitation.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: "Invitation already resolved" },
      { status: 409 },
    );
  }

  try {
    if (action === "accept") {
      const updated = await prisma.projectCollaborator.update({
        where: { id: invitationId },
        data: { status: "ACTIVE" },
        select: { id: true, projectId: true, status: true },
      });
      return NextResponse.json({ invitation: updated });
    }

    await prisma.projectCollaborator.delete({ where: { id: invitationId } });
    return NextResponse.json({ success: true });
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
