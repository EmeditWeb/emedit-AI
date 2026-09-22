import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getProjectsForCurrentUser } from "@/lib/projects-data";
import { gateRequest } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`projects:${userId}:summary`, "list");
  if (denied) return denied;

  const { owned, shared } = await getProjectsForCurrentUser();
  return NextResponse.json({ owned, shared });
}