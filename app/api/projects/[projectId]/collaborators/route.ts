import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

import { enrichCollaborators, getUserProfileById } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import { gateRequest } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PermissionContext {
  isOwner: boolean;
  callerCollaborator: {
    id: string;
    email: string;
    status: "PENDING" | "ACTIVE";
    canShare: boolean;
    canEdit: boolean;
  } | null;
}

async function resolvePermissions(
  projectId: string,
  identity: { userId: string; emails: string[] },
): Promise<{
  project: { ownerId: string } | null;
  permissions: PermissionContext;
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return {
      project: null,
      permissions: { isOwner: false, callerCollaborator: null },
    };
  }

  const isOwner = project.ownerId === identity.userId;
  let callerCollaborator: PermissionContext["callerCollaborator"] = null;

  if (!isOwner && identity.emails.length > 0) {
    const match = await prisma.projectCollaborator.findFirst({
      where: { projectId, email: { in: identity.emails } },
      select: {
        id: true,
        email: true,
        status: true,
        canShare: true,
        canEdit: true,
      },
    });
    if (match) {
      callerCollaborator = {
        id: match.id,
        email: match.email,
        status: match.status,
        canShare: match.canShare,
        canEdit: match.canEdit,
      };
    }
  }

  return { project, permissions: { isOwner, callerCollaborator } };
}

export async function GET(_request: Request, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`collaborators:${identity.userId}`, "read");
  if (denied) return denied;

  const { projectId } = await ctx.params;
  const { project, permissions } = await resolvePermissions(
    projectId,
    identity,
  );
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const callerIsActive =
    permissions.isOwner ||
    permissions.callerCollaborator?.status === "ACTIVE";
  if (!callerIsActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      status: true,
      canShare: true,
      canEdit: true,
    },
  });

  const [profiles, owner] = await Promise.all([
    enrichCollaborators(rows.map((row) => row.email)),
    getUserProfileById(project.ownerId),
  ]);

  const collaborators = rows.map((row, index) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    canShare: row.canShare,
    canEdit: row.canEdit,
    displayName: profiles[index].displayName,
    avatarUrl: profiles[index].avatarUrl,
  }));

  return NextResponse.json({
    owner,
    collaborators,
    ownedByCurrentUser: permissions.isOwner,
    canShare:
      permissions.isOwner ||
      Boolean(permissions.callerCollaborator?.canShare),
    canEdit:
      permissions.isOwner || Boolean(permissions.callerCollaborator?.canEdit),
  });
}

interface InviteBody {
  email?: unknown;
  canEdit?: unknown;
}

export async function POST(request: Request, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`collaborators:${identity.userId}`, "mutate");
  if (denied) return denied;

  const { projectId } = await ctx.params;

  let body: InviteBody;
  try {
    body = (await request.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  if (body.canEdit !== undefined && typeof body.canEdit !== "boolean") {
    return NextResponse.json(
      { error: "`canEdit` must be a boolean" },
      { status: 400 },
    );
  }
  // Default to view-only so an invite never silently confers write access.
  const requestedCanEdit = body.canEdit === true;

  const { project, permissions } = await resolvePermissions(
    projectId,
    identity,
  );
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canInvite =
    permissions.isOwner ||
    (permissions.callerCollaborator?.status === "ACTIVE" &&
      permissions.callerCollaborator.canShare);
  if (!canInvite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (identity.emails.includes(email)) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
        status: "PENDING",
        canShare: false,
        // Only an owner may hand out edit access at invite time; a
        // collaborator with share rights can invite view-only people.
        canEdit: permissions.isOwner ? requestedCanEdit : false,
      },
      select: {
        id: true,
        email: true,
        status: true,
        canShare: true,
        canEdit: true,
      },
    });

    const [profile] = await enrichCollaborators([email]);
    return NextResponse.json(
      {
        collaborator: {
          id: created.id,
          email: created.email,
          status: created.status,
          canShare: created.canShare,
          canEdit: created.canEdit,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Collaborator already invited" },
        { status: 409 },
      );
    }
    throw error;
  }
}

interface RemoveBody {
  email?: unknown;
}

export async function DELETE(request: Request, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`collaborators:${identity.userId}`, "mutate");
  if (denied) return denied;

  const { projectId } = await ctx.params;

  let body: RemoveBody;
  try {
    body = (await request.json()) as RemoveBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length === 0) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  const { project, permissions } = await resolvePermissions(
    projectId,
    identity,
  );
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canRemove =
    permissions.isOwner ||
    (permissions.callerCollaborator?.status === "ACTIVE" &&
      permissions.callerCollaborator.canShare);
  if (!canRemove) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.projectCollaborator
    .delete({ where: { projectId_email: { projectId, email } } })
    .catch((error) => {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    });

  return NextResponse.json({ success: true });
}
