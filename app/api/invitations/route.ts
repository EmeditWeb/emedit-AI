import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getProjectsForCurrentUser } from "@/lib/projects-data";
import { gateRequest } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`invitations:${userId}`, "list");
  if (denied) return denied;

  const { invitations } = await getProjectsForCurrentUser();
  return NextResponse.json({ invitations });
}
