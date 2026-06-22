-- CreateEnum
CREATE TYPE "PrivacyVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DirectMessagePolicy" AS ENUM ('EVERYONE', 'FRIENDS', 'NONE');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELED', 'EXPIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClanVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ClanJoinPolicy" AS ENUM ('OPEN', 'INVITE_ONLY', 'REQUEST_ONLY');

-- CreateEnum
CREATE TYPE "ClanRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "ChatThreadType" AS ENUM ('DM', 'CLAN');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'SYSTEM', 'GAME_INVITE');

-- CreateEnum
CREATE TYPE "StoredFileKind" AS ENUM ('AVATAR', 'CLAN_AVATAR', 'ATTACHMENT');

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "kind" "StoredFileKind" NOT NULL,
    "originalName" VARCHAR(255),
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicPath" TEXT NOT NULL,
    "sha256" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(64),
    "avatarFileId" UUID,
    "bio" VARCHAR(500),
    "country" VARCHAR(2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_privacy_settings" (
    "userId" UUID NOT NULL,
    "profileVisibility" "PrivacyVisibility" NOT NULL DEFAULT 'PUBLIC',
    "friendsVisibility" "PrivacyVisibility" NOT NULL DEFAULT 'FRIENDS',
    "lastSeenVisibility" "PrivacyVisibility" NOT NULL DEFAULT 'FRIENDS',
    "dmPolicy" "DirectMessagePolicy" NOT NULL DEFAULT 'FRIENDS',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_presence" (
    "userId" UUID NOT NULL,
    "status" "PresenceStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" UUID NOT NULL,
    "fromUserId" UUID NOT NULL,
    "toUserId" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" VARCHAR(240),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("userLowId","userHighId")
);

-- CreateTable
CREATE TABLE "blocks" (
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "clans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "tag" VARCHAR(8),
    "ownerUserId" UUID NOT NULL,
    "visibility" "ClanVisibility" NOT NULL DEFAULT 'PUBLIC',
    "joinPolicy" "ClanJoinPolicy" NOT NULL DEFAULT 'INVITE_ONLY',
    "description" VARCHAR(500),
    "avatarFileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clan_members" (
    "clanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "ClanRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutedUntil" TIMESTAMP(3),

    CONSTRAINT "clan_members_pkey" PRIMARY KEY ("clanId","userId")
);

-- CreateTable
CREATE TABLE "clan_invites" (
    "id" UUID NOT NULL,
    "clanId" UUID NOT NULL,
    "invitedUserId" UUID NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "clan_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clan_join_requests" (
    "id" UUID NOT NULL,
    "clanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" VARCHAR(240),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "clan_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" UUID NOT NULL,
    "type" "ChatThreadType" NOT NULL,
    "clanId" UUID,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("threadId","userId")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "clientMessageId" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_deletions" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_deletions_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storagePath_key" ON "stored_files"("storagePath");
CREATE INDEX "stored_files_ownerUserId_idx" ON "stored_files"("ownerUserId");
CREATE INDEX "stored_files_kind_idx" ON "stored_files"("kind");
CREATE UNIQUE INDEX "user_profiles_avatarFileId_key" ON "user_profiles"("avatarFileId");
CREATE INDEX "user_profiles_displayName_idx" ON "user_profiles"("displayName");
CREATE INDEX "user_presence_status_idx" ON "user_presence"("status");
CREATE INDEX "friend_requests_fromUserId_idx" ON "friend_requests"("fromUserId");
CREATE INDEX "friend_requests_toUserId_idx" ON "friend_requests"("toUserId");
CREATE INDEX "friend_requests_status_idx" ON "friend_requests"("status");
CREATE INDEX "friendships_userHighId_idx" ON "friendships"("userHighId");
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");
CREATE UNIQUE INDEX "clans_tag_key" ON "clans"("tag");
CREATE UNIQUE INDEX "clans_avatarFileId_key" ON "clans"("avatarFileId");
CREATE UNIQUE INDEX "clans_name_key" ON "clans"("name");
CREATE INDEX "clans_ownerUserId_idx" ON "clans"("ownerUserId");
CREATE INDEX "clans_visibility_idx" ON "clans"("visibility");
CREATE INDEX "clan_members_userId_idx" ON "clan_members"("userId");
CREATE INDEX "clan_invites_clanId_idx" ON "clan_invites"("clanId");
CREATE INDEX "clan_invites_invitedUserId_idx" ON "clan_invites"("invitedUserId");
CREATE INDEX "clan_invites_status_idx" ON "clan_invites"("status");
CREATE INDEX "clan_join_requests_clanId_idx" ON "clan_join_requests"("clanId");
CREATE INDEX "clan_join_requests_userId_idx" ON "clan_join_requests"("userId");
CREATE INDEX "clan_join_requests_status_idx" ON "clan_join_requests"("status");
CREATE UNIQUE INDEX "chat_threads_clanId_key" ON "chat_threads"("clanId");
CREATE INDEX "chat_threads_type_idx" ON "chat_threads"("type");
CREATE INDEX "chat_threads_createdByUserId_idx" ON "chat_threads"("createdByUserId");
CREATE INDEX "chat_threads_lastMessageAt_idx" ON "chat_threads"("lastMessageAt");
CREATE INDEX "chat_participants_userId_idx" ON "chat_participants"("userId");
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");
CREATE INDEX "messages_senderUserId_idx" ON "messages"("senderUserId");
CREATE INDEX "message_deletions_userId_idx" ON "message_deletions"("userId");

-- CheckConstraints
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_not_self_check" CHECK ("fromUserId" <> "toUserId");
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_order_check" CHECK ("userLowId" < "userHighId");
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_not_self_check" CHECK ("blockerId" <> "blockedId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clans" ADD CONSTRAINT "clans_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clan_invites" ADD CONSTRAINT "clan_invites_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clan_join_requests" ADD CONSTRAINT "clan_join_requests_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
