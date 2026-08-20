"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useOthers, useUser as useLiveblocksUser } from "@liveblocks/react";
import type { CursorsCursorProps } from "@liveblocks/react-flow";
import { useMemo } from "react";

import { cursorColorForConnection } from "@/lib/cursor-colors";

const MAX_VISIBLE_AVATARS = 5;

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export function PresenceOverlay() {
  const { user, isSignedIn } = useUser();
  const others = useOthers();

  const collaborators = useMemo<Collaborator[]>(() => {
    const currentUserId = user?.id;
    return others
      .map((other) => ({
        id: other.id,
        name: other.info?.name ?? "Anonymous",
        avatar: other.info?.avatar,
        color: cursorColorForConnection(other.connectionId),
      }))
      .filter((collaborator) => collaborator.id !== currentUserId);
  }, [others, user?.id]);

  if (!isSignedIn || !user) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = Math.max(0, collaborators.length - MAX_VISIBLE_AVATARS);

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center rounded-full border border-white/10 bg-base/60 p-1.5 pr-2 backdrop-blur-md">
      <div className="flex -space-x-2">
        {visible.map((collaborator) => (
          <CollaboratorAvatar
            key={collaborator.id}
            collaborator={collaborator}
          />
        ))}
        {overflowCount > 0 ? (
          <OverflowChip count={overflowCount} />
        ) : null}
      </div>
      {collaborators.length > 0 ? (
        <div
          aria-hidden
          className="mx-2 h-5 w-px bg-white/15"
        />
      ) : null}
      <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
    </div>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const initials = collaborator.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      title={collaborator.name}
      className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-[#0a0a12]"
      style={{ backgroundColor: collaborator.color }}
    >
      {collaborator.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.avatar}
          alt={collaborator.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function OverflowChip({ count }: { count: number }) {
  return (
    <div
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1b1b25] text-[0.65rem] font-semibold text-copy-secondary ring-2 ring-[#0a0a12]"
      title={`${count} more`}
    >
      +{count}
    </div>
  );
}

export function CanvasCursor({
  userId,
  connectionId,
}: CursorsCursorProps) {
  const { user, isLoading } = useLiveblocksUser(userId);

  if (isLoading) return null;

  const name = user?.name ?? "Anonymous";
  const color = cursorColorForConnection(connectionId);

  return (
    <div className="relative" style={{ color }}>
      <svg
        viewBox="0 0 32 32"
        className="absolute top-0 left-0 h-4 w-4"
        fill="currentColor"
        aria-hidden
      >
        <path d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z" />
      </svg>
      <div
        className="absolute top-0.5 left-5 max-w-40 truncate rounded-full px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] ring-1 ring-black/40"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
}