-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "playerStatsId" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerStatsId_fkey" FOREIGN KEY ("playerStatsId") REFERENCES "PlayerStats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
