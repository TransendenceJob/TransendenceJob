/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Achievement` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('JOINED', 'PLAYING', 'LEFT', 'FINISHED');

-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "createdAt",
ADD COLUMN     "achivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "MatchParticipant" ADD COLUMN     "deaths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kills" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'JOINED',
ALTER COLUMN "isWinner" DROP NOT NULL;
