-- AlterTable
ALTER TABLE "Match"
ADD COLUMN     "mode" TEXT,
ADD COLUMN     "mapName" TEXT,
ADD COLUMN     "score" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MatchParticipant"
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "avatarUrl" TEXT;
