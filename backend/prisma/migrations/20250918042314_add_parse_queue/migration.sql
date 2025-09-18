-- CreateTable
CREATE TABLE "public"."parse_queue" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "resumeIds" TEXT[],
    "status" "public"."JobQueueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "parse_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parse_queue_status_idx" ON "public"."parse_queue"("status");

-- CreateIndex
CREATE INDEX "parse_queue_userID_idx" ON "public"."parse_queue"("userID");

-- CreateIndex
CREATE INDEX "parse_queue_createdAt_idx" ON "public"."parse_queue"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."parse_queue" ADD CONSTRAINT "parse_queue_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
