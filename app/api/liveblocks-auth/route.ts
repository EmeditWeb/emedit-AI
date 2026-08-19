import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserProfileById } from "@/lib/collaborators";
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";
import { getProjectForAccess } from "@/lib/project-access";

interface AuthRequestBody {
  room?: string;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const existing = await liveblocks.getRoom(project.id).catch(() => null);
  if (!existing) {
    await liveblocks.createRoom(project.id, {
      defaultAccesses: [],
      usersAccesses: {
        [userId]: ["room:write"],
      },
    });
  } else {
    await liveblocks.updateRoom(project.id, {
      usersAccesses: {
        [userId]: ["room:write"],
      },
    });
  }

  const profile = await getUserProfileById(userId);
  const color = getCursorColorForUser(userId);
  const name = profile?.displayName ?? profile?.email ?? "Anonymous";
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
