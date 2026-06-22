/*
  Warnings:

  - You are about to drop the column `achivedAt` on the `Achievement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,type]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "achivedAt",
ADD COLUMN     "achieved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "achievedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressTarget" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "xpReward" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_type_key" ON "Achievement"("userId", "type");
