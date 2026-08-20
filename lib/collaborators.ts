import { clerkClient } from "@clerk/nextjs/server";

export interface CollaboratorProfile {
  email: string;
  displayName: string | null;
  /** Clerk account username, if one is set (e.g. OAuth-only accounts). */
  username?: string | null;
  avatarUrl: string | null;
}

function buildDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fullName: string | null | undefined,
): string | null {
  if (fullName && fullName.trim().length > 0) return fullName.trim();
  const parts = [firstName, lastName]
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function getUserProfileById(
  userId: string,
): Promise<CollaboratorProfile | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
    const displayName = buildDisplayName(
      user.firstName,
      user.lastName,
      user.fullName ?? null,
    );
    // Only bail when the account has no identity surface at all (no email,
    // username, or name parts) so a real signed-in user is never reported as
    // "Anonymous" because a single resolution path came up empty.
    if (!displayName && !primaryEmail && !user.username) return null;
    return {
      email: primaryEmail,
      displayName,
      username: user.username ?? null,
      avatarUrl: user.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function enrichCollaborators(
  emails: ReadonlyArray<string>,
): Promise<CollaboratorProfile[]> {
  if (emails.length === 0) return [];

  const lookup = new Map<string, { displayName: string | null; avatarUrl: string | null }>();

  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      emailAddress: [...emails],
      limit: Math.min(emails.length * 2, 100),
    });

    for (const user of response.data) {
      const displayName = buildDisplayName(
        user.firstName,
        user.lastName,
        user.fullName ?? null,
      );
      const avatarUrl = user.imageUrl ?? null;
      for (const entry of user.emailAddresses) {
        if (entry.emailAddress) {
          lookup.set(entry.emailAddress.toLowerCase(), {
            displayName,
            avatarUrl,
          });
        }
      }
    }
  } catch {
    // Fall through with empty lookup — callers get email-only fallback.
  }

  return emails.map((email) => {
    const hit = lookup.get(email.toLowerCase());
    return {
      email,
      displayName: hit?.displayName ?? null,
      avatarUrl: hit?.avatarUrl ?? null,
    };
  });
}

/**
 * Resolve the Clerk user id behind an email, if that person has an account.
 * Used to push permission changes into a Liveblocks room immediately rather
 * than waiting for the collaborator's access token to expire.
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    return response.data[0]?.id ?? null;
  } catch {
    return null;
  }
}
