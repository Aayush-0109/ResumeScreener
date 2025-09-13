-- CreateEnum
CREATE TYPE "public"."JobQueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."JobQueue" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."JobQueueStatus" NOT NULL DEFAULT 'PENDING',
    "topN" INTEGER,
    "weights" JSONB,
    "insightTopK" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resultData" JSONB,
    "errorMessage" TEXT,
    "progress" INTEGER DEFAULT 0,
    "totalResumes" INTEGER,
    "processedResumes" INTEGER DEFAULT 0,

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."JobQueue" ADD CONSTRAINT "JobQueue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobQueue" ADD CONSTRAINT "JobQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
