-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROJECT_DELETED', 'INVITED');

-- CreateTable
CREATE TABLE "ProjectNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'PROJECT_DELETED',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectNotification_userId_readAt_idx" ON "ProjectNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ProjectNotification_userId_createdAt_idx" ON "ProjectNotification"("userId", "createdAt");
