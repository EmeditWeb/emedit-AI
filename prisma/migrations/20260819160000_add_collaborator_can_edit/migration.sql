-- AlterTable
-- New collaborators are view-only unless the owner grants edit at invite time.
ALTER TABLE "ProjectCollaborator" ADD COLUMN     "canEdit" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: collaborators that already existed had implicit edit access
-- (every authorised user was granted room:write), so preserve it for them
-- rather than silently demoting people mid-session.
UPDATE "ProjectCollaborator" SET "canEdit" = true;
