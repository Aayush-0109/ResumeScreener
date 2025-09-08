/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ParseStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "public"."resumes" ADD COLUMN     "parseStatus" "public"."ParseStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "parsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT;
