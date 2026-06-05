/*
  Warnings:

  - The values [CANCELLED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `loserId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MatchParticipant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchId,userId]` on the table `MatchParticipant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `isWinner` on table `MatchParticipant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED');
ALTER TABLE "public"."Match" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Match" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_loserId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_winnerId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "loserId",
DROP COLUMN "winnerId",
ALTER COLUMN "duration" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MatchParticipant" DROP COLUMN "status",
ALTER COLUMN "isWinner" SET NOT NULL,
ALTER COLUMN "isWinner" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_userId_key" ON "MatchParticipant"("matchId", "userId");
