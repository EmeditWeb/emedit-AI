import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getProjectForAccess } from "@/lib/project-access";
import { gateRequest } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

/**
 * Lightweight real-time access probe used by the open workspace to reflect an
 * owner's deletion (or a revoked membership) immediately instead of waiting for
 * a reload. Distinguishes "deleted" from "denied" by checking row existence.
 */
export async function GET(_request: Request, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`projects:${userId}:access`, "read");
  if (denied) return denied;

  const { projectId } = await ctx.params;

  const result = await getProjectForAccess(projectId);
  if (result.kind === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (result.kind === "ok") {
    return NextResponse.json({ ok: true });
  }

  // The caller lost access — is it because the workspace was deleted, or because
  // the membership is gone while the project still exists?
  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  return NextResponse.json({
    ok: false,
    reason: exists ? "denied" : "deleted",
  });
}