/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `resumes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."resumes" DROP COLUMN "fileUrl",
DROP COLUMN "publicId",
ADD COLUMN     "fileBuffer" BYTEA;
