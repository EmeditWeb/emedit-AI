import { auth } from "@clerk/nextjs/server";
import type { RoomAccesses } from "@liveblocks/node";
import { NextResponse } from "next/server";

import { getUserProfileById } from "@/lib/collaborators";
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";
import { getProjectForAccess } from "@/lib/project-access";
import { gateRequest } from "@/lib/rate-limit";

interface AuthRequestBody {
  room?: string;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`liveblocks-auth:${userId}`, "liveblocks");
  if (denied) return denied;

  let body: AuthRequestBody = {};
  try {
    body = (await request.json()) as AuthRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const roomId = body.room?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "Missing room" }, { status: 400 });
  }

  const access = await getProjectForAccess(roomId);
  if (access.kind === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (access.kind === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { project } = access;
  const liveblocks = getLiveblocksClient();

  // The room grant is the authoritative permission boundary: a view-only
  // collaborator gets presence (cursors) but cannot mutate storage, so the
  // server rejects writes even if the client UI is bypassed.
  const accesses: RoomAccesses[string] = project.canEdit
    ? ["room:write"]
    : ["room:read", "room:presence:write"];

  const existing = await liveblocks.getRoom(project.id).catch(() => null);
  if (!existing) {
    await liveblocks.createRoom(project.id, {
      defaultAccesses: [],
      usersAccesses: { [userId]: accesses },
    });
  } else {
    await liveblocks.updateRoom(project.id, {
      usersAccesses: { [userId]: accesses },
    });
  }

  const profile = await getUserProfileById(userId);
  const color = getCursorColorForUser(userId);
  // Prefer the account username so team members always see who is active on the
  // canvas; fall back to a display name or email, and only to "Anonymous" when
  // the account carries no identity at all.
  const name =
    profile?.username ??
    profile?.displayName ??
    profile?.email ??
    "Anonymous";
  const userInfo: { name: string; avatar?: string; color: string } = {
    name,
    color,
  };
  if (profile?.avatarUrl) {
    userInfo.avatar = profile.avatarUrl;
  }

  const { status, body: responseBody } = await liveblocks.identifyUser(
    { userId, groupIds: [] },
    { userInfo },
  );

  return new Response(responseBody, { status });
}
