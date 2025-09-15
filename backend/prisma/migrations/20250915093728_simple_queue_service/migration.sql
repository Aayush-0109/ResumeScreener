/*
  Warnings:

  - You are about to drop the `JobQueue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JobQueue" DROP CONSTRAINT "JobQueue_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."JobQueue" DROP CONSTRAINT "JobQueue_userId_fkey";

-- DropTable
DROP TABLE "public"."JobQueue";

-- CreateTable
CREATE TABLE "public"."job_queue" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."JobQueueStatus" NOT NULL DEFAULT 'PENDING',
    "topN" INTEGER,
    "weights" JSONB,
    "insightsTopK" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resultData" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_queue_status_idx" ON "public"."job_queue"("status");

-- CreateIndex
CREATE INDEX "job_queue_userId_idx" ON "public"."job_queue"("userId");

-- CreateIndex
CREATE INDEX "job_queue_createdAt_idx" ON "public"."job_queue"("createdAt");

-- CreateIndex
CREATE INDEX "job_queue_jobId_idx" ON "public"."job_queue"("jobId");

-- AddForeignKey
ALTER TABLE "public"."job_queue" ADD CONSTRAINT "job_queue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_queue" ADD CONSTRAINT "job_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
