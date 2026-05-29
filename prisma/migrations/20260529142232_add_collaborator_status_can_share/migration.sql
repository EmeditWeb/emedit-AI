-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "ProjectCollaborator" ADD COLUMN     "canShare" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "CollaboratorStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "ProjectCollaborator_email_status_idx" ON "ProjectCollaborator"("email", "status");
