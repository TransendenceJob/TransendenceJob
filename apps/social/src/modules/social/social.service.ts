import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChatThreadType,
  ClanJoinPolicy,
  ClanRole,
  MessageContentType,
  PresenceStatus,
  Prisma,
  RequestStatus,
  StoredFileKind,
} from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { SocialRedisService } from '../redis/social-redis.service';
import { RabbitmqEventService } from '../events/rabbitmq-event.service';
import { SocialConfigService } from '../config/social-config.service';
import type { AuthPrincipal } from '../auth/auth-principal';
import { isAdmin } from '../auth/auth-principal';
import {
  AuthDirectoryService,
  type AuthDirectoryUser,
} from '../auth/auth-directory.service';
import type {
  CreateBlockDto,
  CreateClanDto,
  CreateClanInviteDto,
  CreateDmDto,
  CreateFriendRequestDto,
  CreateJoinRequestDto,
  EditMessageDto,
  ListQueryDto,
  MarkReadDto,
  SendMessageDto,
  UpdateClanDto,
  UpdateClanMemberDto,
  UpdatePresenceDto,
  UpdatePrivacyDto,
  UpdateProfileDto,
} from './social.dto';
import { assertImageFile, extensionForMime, saveProfileWithAvatarFile } from './utils';

type DbClient = PrismaService | Prisma.TransactionClient;

type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: SocialRedisService,
    private readonly events: RabbitmqEventService,
    private readonly config: SocialConfigService,
    private readonly authDirectory: AuthDirectoryService,
  ) {}

  async getProfile(userId: string, principal: AuthPrincipal) {
    await this.ensureProfile(userId);
    const viewerId = principal.claims.sub;
    const profile = await this.loadProfile(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.assertCanSeeProfile(userId, viewerId, principal);
    return this.toProfileView(profile, viewerId, principal);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);

    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        bio: input.bio,
        country: input.country?.toUpperCase(),
      },
      include: this.profileInclude(),
    });

    this.events.publish('profile.updated', { userId });
    return this.toProfileView(profile, principal.claims.sub, principal);
  }

  // Save profile metadata first, then store the avatar file if provided.
  async saveProfile(
    userId: string,
    input: UpdateProfileDto,
    file: UploadedMemoryFile | undefined,
    principal: AuthPrincipal,
  ) {
    return saveProfileWithAvatarFile(
      userId,
      input,
      file,
      (uid, inp, prin) => this.updateProfile(uid, inp, prin),
      (uid, f, prin) => this.uploadAvatar(uid, f, prin),
      principal,
    );
  }

  async searchUsers(query: ListQueryDto, principal: AuthPrincipal) {
    const limit = query.limit ?? 25;
    const identities = await this.searchAuthDirectory(query, principal);
    const authUserIds = Array.from(identities.keys());

    if (authUserIds.length > 0) {
      await Promise.all(authUserIds.map((id) => this.ensureProfile(id)));
    }

    const items = await this.prisma.userProfile.findMany({
      where: this.buildUserSearchWhere(query.query, authUserIds),
      orderBy: [{ displayName: 'asc' }, { userId: 'asc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { userId: query.cursor }, skip: 1 } : {}),
      include: this.profileInclude(),
    });

    const visible: unknown[] = [];
    for (const profile of items.slice(0, limit)) {
      if (
        await this.canSeeProfile(
          profile.userId,
          principal.claims.sub,
          principal,
        )
      ) {
        visible.push(
          await this.toProfileSearchView(
            profile,
            principal.claims.sub,
            principal,
            identities.get(profile.userId),
          ),
        );
      }
    }

    return {
      items: visible,
      pageInfo: {
        hasNextPage: items.length > limit,
        nextCursor: items.length > limit ? items[limit - 1]?.userId : null,
      },
    };
  }

  async getPrivacy(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);
    return this.prisma.userPrivacySetting.findUniqueOrThrow({
      where: { userId },
    });
  }

  async updatePrivacy(
    userId: string,
    input: UpdatePrivacyDto,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);
    const privacy = await this.prisma.userPrivacySetting.update({
      where: { userId },
      data: input,
    });
    this.events.publish('privacy.updated', { userId });
    return privacy;
  }

  async updatePresence(
    userId: string,
    input: UpdatePresenceDto,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);
    const status = input.status as PresenceStatus;
    if (status !== PresenceStatus.OFFLINE) {
      await this.redis.touchPresence(userId);
    }

    const presence = await this.prisma.userPresence.update({
      where: { userId },
      data: {
        status,
        lastSeenAt: status === PresenceStatus.OFFLINE ? new Date() : undefined,
      },
    });

    this.events.publish('presence.updated', { userId, status });
    return presence;
  }

  async markSocketOnline(userId: string, socketId: string) {
    await this.ensureProfile(userId);
    await this.redis.markConnection(userId, socketId);
    await this.prisma.userPresence.update({
      where: { userId },
      data: { status: PresenceStatus.ONLINE },
    });
    this.events.publish('presence.online', { userId });
  }

  async markSocketDisconnected(userId: string, socketId: string) {
    await this.redis.removeConnection(userId, socketId);
    if (await this.redis.hasActiveConnections(userId)) {
      return false;
    }

    await this.prisma.userPresence.update({
      where: { userId },
      data: {
        status: PresenceStatus.OFFLINE,
        lastSeenAt: new Date(),
      },
    });
    this.events.publish('presence.offline', { userId });
    return true;
  }

  async uploadAvatar(
    userId: string,
    file: UploadedMemoryFile,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);
    assertImageFile(file, this.config.uploads.avatarMaxBytes);

    const extension = extensionForMime(file.mimetype!);
    const fileName = `${userId}-${randomUUID()}${extension}`;
    const avatarDir = join(this.config.uploads.root, 'avatars');
    const storagePath = join(avatarDir, fileName);
    await mkdir(avatarDir, { recursive: true });
    await writeFile(storagePath, file.buffer!);

    const oldProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { avatarFile: true },
    });

    const sha256 = createHash('sha256').update(file.buffer!).digest('hex');
    const profile = await this.prisma.$transaction(async (tx) => {
      const storedFile = await tx.storedFile.create({
        data: {
          ownerUserId: userId,
          kind: StoredFileKind.AVATAR,
          originalName: file.originalname,
          mimeType: file.mimetype!,
          sizeBytes: file.size ?? file.buffer!.length,
          storagePath,
          publicPath: `${this.config.uploads.publicBasePath}/avatars/${fileName}`,
          sha256,
        },
      });

      if (oldProfile?.avatarFileId) {
        await tx.storedFile.update({
          where: { id: oldProfile.avatarFileId },
          data: { deletedAt: new Date() },
        });
      }

      return tx.userProfile.update({
        where: { userId },
        data: { avatarFileId: storedFile.id },
        include: this.profileInclude(),
      });
    });

    if (oldProfile?.avatarFile?.storagePath) {
      await unlink(oldProfile.avatarFile.storagePath).catch(() => undefined);
    }

    this.events.publish('profile.avatar.updated', { userId });
    return this.toProfileView(profile, principal.claims.sub, principal);
  }

  async deleteAvatar(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    await this.ensureProfile(userId);
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { avatarFile: true },
    });

    if (!profile?.avatarFileId) {
      return { success: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.update({
        where: { userId },
        data: { avatarFileId: null },
      });
      await tx.storedFile.update({
        where: { id: profile.avatarFileId! },
        data: { deletedAt: new Date() },
      });
    });

    if (profile.avatarFile?.storagePath) {
      await unlink(profile.avatarFile.storagePath).catch(() => undefined);
    }

    this.events.publish('profile.avatar.deleted', { userId });
    return { success: true };
  }

  async openAvatar(fileName: string) {
    const safeName = basename(fileName);
    if (safeName !== fileName) {
      throw new BadRequestException('Invalid file name');
    }

    const storagePath = join(this.config.uploads.root, 'avatars', safeName);
    const file = await this.prisma.storedFile.findFirst({
      where: {
        storagePath,
        kind: StoredFileKind.AVATAR,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return {
      stream: createReadStream(storagePath),
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    };
  }

  async listFriends(userId: string, principal: AuthPrincipal) {
    await this.ensureProfile(userId);
    await this.assertCanViewFriends(userId, principal);
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    const friendIds = friendships.map((friendship) =>
      friendship.userLowId === userId
        ? friendship.userHighId
        : friendship.userLowId,
    );
    await Promise.all(friendIds.map((id) => this.ensureProfile(id)));

    const profiles = await this.prisma.userProfile.findMany({
      where: { userId: { in: friendIds } },
      include: this.profileInclude(),
    });

    return {
      items: await Promise.all(
        profiles.map((profile) =>
          this.toProfileView(profile, principal.claims.sub, principal),
        ),
      ),
    };
  }

  async createFriendRequest(
    input: CreateFriendRequestDto,
    principal: AuthPrincipal,
  ) {
    const fromUserId = principal.claims.sub;
    const toUserId = input.toUserId;
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    await Promise.all([
      this.ensureProfile(fromUserId),
      this.ensureProfile(toUserId),
    ]);
    if (await this.isBlockedEitherWay(fromUserId, toUserId)) {
      throw new ForbiddenException('Friend request blocked');
    }
    if (await this.areFriends(fromUserId, toUserId)) {
      throw new ConflictException('Users are already friends');
    }

    const pending = await this.prisma.friendRequest.findFirst({
      where: {
        status: RequestStatus.PENDING,
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });
    if (pending) {
      throw new ConflictException('A pending friend request already exists');
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        message: input.message,
      },
    });
    this.events.publish('friend.request.created', {
      requestId: request.id,
      fromUserId,
      toUserId,
    });
    return request;
  }

  async listIncomingFriendRequests(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    return {
      items: await this.prisma.friendRequest.findMany({
        where: { toUserId: userId, status: RequestStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async listOutgoingFriendRequests(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    return {
      items: await this.prisma.friendRequest.findMany({
        where: { fromUserId: userId, status: RequestStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async acceptFriendRequest(requestId: string, principal: AuthPrincipal) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending friend request not found');
    }
    this.assertSelfOrAdmin(request.toUserId, principal);

    const pair = this.friendshipPair(request.fromUserId, request.toUserId);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.ACCEPTED, respondedAt: new Date() },
      });
      await tx.friendship.upsert({
        where: {
          userLowId_userHighId: pair,
        },
        create: pair,
        update: {},
      });
      return tx.friendRequest.findUniqueOrThrow({ where: { id: requestId } });
    });

    this.events.publish('friend.request.accepted', {
      requestId,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });
    return result;
  }

  async declineFriendRequest(requestId: string, principal: AuthPrincipal) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending friend request not found');
    }
    this.assertSelfOrAdmin(request.toUserId, principal);
    const updated = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.DECLINED, respondedAt: new Date() },
    });
    this.events.publish('friend.request.declined', { requestId });
    return updated;
  }

  async cancelFriendRequest(requestId: string, principal: AuthPrincipal) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending friend request not found');
    }
    this.assertSelfOrAdmin(request.fromUserId, principal);
    const updated = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELED, respondedAt: new Date() },
    });
    this.events.publish('friend.request.canceled', { requestId });
    return updated;
  }

  async removeFriend(
    userId: string,
    otherUserId: string,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    const pair = this.friendshipPair(userId, otherUserId);
    await this.prisma.friendship
      .delete({
        where: { userLowId_userHighId: pair },
      })
      .catch(() => {
        throw new NotFoundException('Friendship not found');
      });
    this.events.publish('friend.removed', { userId, otherUserId });
    return { success: true };
  }

  async listBlocks(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    return {
      items: await this.prisma.block.findMany({
        where: { blockerId: userId },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async createBlock(input: CreateBlockDto, principal: AuthPrincipal) {
    const blockerId = principal.claims.sub;
    const blockedId = input.blockedUserId;
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const pair = this.friendshipPair(blockerId, blockedId);
    const block = await this.prisma.$transaction(async (tx) => {
      await tx.friendship
        .delete({ where: { userLowId_userHighId: pair } })
        .catch(() => undefined);
      await tx.friendRequest.updateMany({
        where: {
          status: RequestStatus.PENDING,
          OR: [
            { fromUserId: blockerId, toUserId: blockedId },
            { fromUserId: blockedId, toUserId: blockerId },
          ],
        },
        data: { status: RequestStatus.CANCELED, respondedAt: new Date() },
      });
      return tx.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });
    });
    this.events.publish('block.created', { blockerId, blockedId });
    return block;
  }

  async removeBlock(
    userId: string,
    blockedUserId: string,
    principal: AuthPrincipal,
  ) {
    this.assertSelfOrAdmin(userId, principal);
    await this.prisma.block
      .delete({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId },
        },
      })
      .catch(() => {
        throw new NotFoundException('Block not found');
      });
    this.events.publish('block.removed', {
      blockerId: userId,
      blockedId: blockedUserId,
    });
    return { success: true };
  }

  async createClan(input: CreateClanDto, principal: AuthPrincipal) {
    const ownerUserId = principal.claims.sub;
    await this.ensureProfile(ownerUserId);
    const clan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.clan.create({
        data: {
          name: input.name,
          tag: input.tag?.toUpperCase(),
          ownerUserId,
          visibility: input.visibility ?? 'PUBLIC',
          joinPolicy: input.joinPolicy ?? 'INVITE_ONLY',
          description: input.description,
        },
      });
      await tx.clanMember.create({
        data: {
          clanId: created.id,
          userId: ownerUserId,
          role: ClanRole.OWNER,
        },
      });
      const thread = await tx.chatThread.create({
        data: {
          type: ChatThreadType.CLAN,
          clanId: created.id,
          createdByUserId: ownerUserId,
        },
      });
      await tx.chatParticipant.create({
        data: { threadId: thread.id, userId: ownerUserId },
      });
      return tx.clan.findUniqueOrThrow({
        where: { id: created.id },
        include: this.clanInclude(),
      });
    });
    this.events.publish('clan.created', { clanId: clan.id, ownerUserId });
    return this.toClanView(clan);
  }

  async listClans(query: ListQueryDto) {
    const limit = query.limit ?? 25;
    const clans = await this.prisma.clan.findMany({
      where: {
        visibility: 'PUBLIC',
        ...(query.query
          ? {
              OR: [
                { name: { contains: query.query, mode: 'insensitive' } },
                {
                  tag: {
                    contains: query.query.toUpperCase(),
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: this.clanInclude(),
    });

    return {
      items: clans.slice(0, limit).map((clan) => this.toClanView(clan)),
      pageInfo: {
        hasNextPage: clans.length > limit,
        nextCursor: clans.length > limit ? clans[limit - 1]?.id : null,
      },
    };
  }

  async getClan(clanId: string, principal: AuthPrincipal) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: this.clanInclude(),
    });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (clan.visibility === 'PRIVATE' && !isAdmin(principal)) {
      await this.assertClanMember(clanId, principal.claims.sub);
    }
    return this.toClanView(clan);
  }

  async updateClan(
    clanId: string,
    input: UpdateClanDto,
    principal: AuthPrincipal,
  ) {
    await this.assertClanAdmin(clanId, principal);
    const clan = await this.prisma.clan.update({
      where: { id: clanId },
      data: {
        name: input.name,
        tag: input.tag === null ? null : input.tag?.toUpperCase(),
        visibility: input.visibility,
        joinPolicy: input.joinPolicy,
        description: input.description,
      },
      include: this.clanInclude(),
    });
    this.events.publish('clan.updated', { clanId });
    return this.toClanView(clan);
  }

  async deleteClan(clanId: string, principal: AuthPrincipal) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (!isAdmin(principal) && clan.ownerUserId !== principal.claims.sub) {
      throw new ForbiddenException(
        'Only the clan owner or an admin can delete the clan',
      );
    }
    await this.prisma.clan.delete({ where: { id: clanId } });
    this.events.publish('clan.deleted', { clanId });
    return { success: true };
  }

  async listClansByUser(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    const memberships = await this.prisma.clanMember.findMany({
      where: { userId },
      include: { clan: { include: this.clanInclude() } },
      orderBy: { joinedAt: 'desc' },
    });
    return {
      items: memberships.map((membership) => ({
        membership,
        clan: this.toClanView(membership.clan),
      })),
    };
  }

  async listClanMembers(clanId: string, principal: AuthPrincipal) {
    await this.assertClanReadable(clanId, principal);
    return {
      items: await this.prisma.clanMember.findMany({
        where: { clanId },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      }),
    };
  }

  async getClanMembership(
    clanId: string,
    userId: string,
    principal: AuthPrincipal,
  ) {
    await this.assertClanReadable(clanId, principal);
    const membership = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return membership;
  }

  async updateClanMember(
    clanId: string,
    userId: string,
    input: UpdateClanMemberDto,
    principal: AuthPrincipal,
  ) {
    await this.assertClanAdmin(clanId, principal);
    const member = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (!member) {
      throw new NotFoundException('Membership not found');
    }

    if (member.role === ClanRole.OWNER && !isAdmin(principal)) {
      throw new ForbiddenException('Owner membership cannot be changed');
    }

    const mutedUntil =
      input.mutedUntil === null
        ? null
        : input.mutedUntil
          ? new Date(input.mutedUntil)
          : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.role === ClanRole.OWNER) {
        await tx.clanMember.updateMany({
          where: { clanId, role: ClanRole.OWNER },
          data: { role: ClanRole.ADMIN },
        });
        await tx.clan.update({
          where: { id: clanId },
          data: { ownerUserId: userId },
        });
      }
      return tx.clanMember.update({
        where: { clanId_userId: { clanId, userId } },
        data: { role: input.role, mutedUntil },
      });
    });

    this.events.publish('clan.member.updated', { clanId, userId });
    return updated;
  }

  async removeClanMember(
    clanId: string,
    userId: string,
    principal: AuthPrincipal,
  ) {
    const target = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (!target) {
      throw new NotFoundException('Membership not found');
    }

    const selfLeave = userId === principal.claims.sub;
    if (!selfLeave) {
      await this.assertClanAdmin(clanId, principal);
    }
    if (target.role === ClanRole.OWNER) {
      const count = await this.prisma.clanMember.count({ where: { clanId } });
      if (count > 1) {
        throw new ForbiddenException(
          'Transfer ownership before removing the owner',
        );
      }
    }

    const clan = await this.prisma.clan.findUniqueOrThrow({
      where: { id: clanId },
      include: { chatThread: true },
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.clanMember.delete({
        where: { clanId_userId: { clanId, userId } },
      });
      if (clan.chatThread) {
        await tx.chatParticipant
          .delete({
            where: {
              threadId_userId: {
                threadId: clan.chatThread.id,
                userId,
              },
            },
          })
          .catch(() => undefined);
      }
    });
    this.events.publish('clan.member.removed', { clanId, userId });
    return { success: true };
  }

  async createClanInvite(
    clanId: string,
    input: CreateClanInviteDto,
    principal: AuthPrincipal,
  ) {
    await this.assertClanAdmin(clanId, principal);
    const invitedUserId = input.invitedUserId;
    const existingMember = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId: invitedUserId } },
    });
    if (existingMember) {
      throw new ConflictException('User is already a clan member');
    }
    const pending = await this.prisma.clanInvite.findFirst({
      where: { clanId, invitedUserId, status: RequestStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('A pending clan invite already exists');
    }

    const invite = await this.prisma.clanInvite.create({
      data: {
        clanId,
        invitedUserId,
        invitedByUserId: principal.claims.sub,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    this.events.publish('clan.invite.created', {
      clanId,
      inviteId: invite.id,
      invitedUserId,
    });
    return invite;
  }

  async listClanInvitesByUser(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    return {
      items: await this.prisma.clanInvite.findMany({
        where: { invitedUserId: userId, status: RequestStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        include: { clan: true },
      }),
    };
  }

  async acceptClanInvite(inviteId: string, principal: AuthPrincipal) {
    const invite = await this.prisma.clanInvite.findUnique({
      where: { id: inviteId },
      include: { clan: { include: { chatThread: true } } },
    });
    if (!invite || invite.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending clan invite not found');
    }
    this.assertSelfOrAdmin(invite.invitedUserId, principal);
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Clan invite expired');
    }

    const membership = await this.addClanMemberFromRequest(
      invite.clanId,
      invite.invitedUserId,
      async (tx) => {
        await tx.clanInvite.update({
          where: { id: inviteId },
          data: { status: RequestStatus.ACCEPTED, respondedAt: new Date() },
        });
      },
    );
    this.events.publish('clan.invite.accepted', {
      inviteId,
      clanId: invite.clanId,
    });
    return membership;
  }

  async declineClanInvite(inviteId: string, principal: AuthPrincipal) {
    const invite = await this.prisma.clanInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending clan invite not found');
    }
    this.assertSelfOrAdmin(invite.invitedUserId, principal);
    const updated = await this.prisma.clanInvite.update({
      where: { id: inviteId },
      data: { status: RequestStatus.DECLINED, respondedAt: new Date() },
    });
    this.events.publish('clan.invite.declined', { inviteId });
    return updated;
  }

  async createJoinRequest(
    clanId: string,
    input: CreateJoinRequestDto,
    principal: AuthPrincipal,
  ) {
    const userId = principal.claims.sub;
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: { chatThread: true },
    });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (await this.isClanMember(clanId, userId)) {
      throw new ConflictException('Already a clan member');
    }
    if (clan.joinPolicy === ClanJoinPolicy.INVITE_ONLY) {
      throw new ForbiddenException('This clan is invite only');
    }
    if (clan.joinPolicy === ClanJoinPolicy.OPEN) {
      return this.addClanMemberFromRequest(clanId, userId);
    }

    const pending = await this.prisma.clanJoinRequest.findFirst({
      where: { clanId, userId, status: RequestStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('A pending join request already exists');
    }

    const request = await this.prisma.clanJoinRequest.create({
      data: { clanId, userId, message: input.message },
    });
    this.events.publish('clan.join_request.created', {
      clanId,
      requestId: request.id,
      userId,
    });
    return request;
  }

  async listJoinRequests(clanId: string, principal: AuthPrincipal) {
    await this.assertClanAdmin(clanId, principal);
    return {
      items: await this.prisma.clanJoinRequest.findMany({
        where: { clanId, status: RequestStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async approveJoinRequest(requestId: string, principal: AuthPrincipal) {
    const request = await this.prisma.clanJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending join request not found');
    }
    await this.assertClanAdmin(request.clanId, principal);
    const membership = await this.addClanMemberFromRequest(
      request.clanId,
      request.userId,
      async (tx) => {
        await tx.clanJoinRequest.update({
          where: { id: requestId },
          data: { status: RequestStatus.APPROVED, respondedAt: new Date() },
        });
      },
    );
    this.events.publish('clan.join_request.approved', {
      requestId,
      clanId: request.clanId,
    });
    return membership;
  }

  async rejectJoinRequest(requestId: string, principal: AuthPrincipal) {
    const request = await this.prisma.clanJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending join request not found');
    }
    await this.assertClanAdmin(request.clanId, principal);
    const updated = await this.prisma.clanJoinRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.REJECTED, respondedAt: new Date() },
    });
    this.events.publish('clan.join_request.rejected', { requestId });
    return updated;
  }

  async isClanMemberResponse(clanId: string, userId: string) {
    return { isMember: await this.isClanMember(clanId, userId) };
  }

  async listThreads(userId: string, principal: AuthPrincipal) {
    this.assertSelfOrAdmin(userId, principal);
    return {
      items: await this.prisma.chatThread.findMany({
        where: { participants: { some: { userId } } },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        include: this.threadInclude(userId),
      }),
    };
  }

  async createOrGetDm(input: CreateDmDto, principal: AuthPrincipal) {
    const userId = principal.claims.sub;
    const otherUserId = input.otherUserId;
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot create a DM with yourself');
    }
    await Promise.all([
      this.ensureProfile(userId),
      this.ensureProfile(otherUserId),
    ]);
    if (await this.isBlockedEitherWay(userId, otherUserId)) {
      throw new ForbiddenException('DM blocked');
    }
    const otherPrivacy = await this.prisma.userPrivacySetting.findUnique({
      where: { userId: otherUserId },
    });
    if (otherPrivacy?.dmPolicy === 'NONE') {
      throw new ForbiddenException('User does not accept direct messages');
    }
    if (
      otherPrivacy?.dmPolicy === 'FRIENDS' &&
      !(await this.areFriends(userId, otherUserId))
    ) {
      throw new ForbiddenException('Only friends can send direct messages');
    }

    const existing = await this.prisma.chatThread.findFirst({
      where: {
        type: ChatThreadType.DM,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: this.threadInclude(userId),
    });
    if (existing) {
      return existing;
    }

    const thread = await this.prisma.chatThread.create({
      data: {
        type: ChatThreadType.DM,
        createdByUserId: userId,
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: this.threadInclude(userId),
    });
    this.events.publish('chat.dm.created', {
      threadId: thread.id,
      userId,
      otherUserId,
    });
    return thread;
  }

  async getThread(threadId: string, principal: AuthPrincipal) {
    await this.assertThreadParticipant(threadId, principal);
    return this.prisma.chatThread.findUniqueOrThrow({
      where: { id: threadId },
      include: this.threadInclude(principal.claims.sub),
    });
  }

  async listMessages(
    threadId: string,
    query: ListQueryDto,
    principal: AuthPrincipal,
  ) {
    await this.assertThreadParticipant(threadId, principal);
    const limit = query.limit ?? 50;
    const messages = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return {
      items: messages.slice(0, limit).reverse(),
      pageInfo: {
        hasNextPage: messages.length > limit,
        nextCursor: messages.length > limit ? messages[limit - 1]?.id : null,
      },
    };
  }

  async sendMessage(
    threadId: string,
    input: SendMessageDto,
    principal: AuthPrincipal,
  ) {
    await this.assertThreadParticipant(threadId, principal);
    const senderUserId = principal.claims.sub;
    const participant = await this.prisma.chatParticipant.findUniqueOrThrow({
      where: { threadId_userId: { threadId, userId: senderUserId } },
    });
    if (participant.isMuted) {
      throw new ForbiddenException('Thread is muted for this user');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          threadId,
          senderUserId,
          content: input.content,
          contentType: (input.contentType ?? 'TEXT') as MessageContentType,
          clientMessageId: input.clientMessageId,
        },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });
    this.events.publish('chat.message.created', {
      threadId,
      messageId: message.id,
      senderUserId,
    });
    return message;
  }

  async sendClanMessage(
    clanId: string,
    input: SendMessageDto,
    principal: AuthPrincipal,
  ) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: { chatThread: true },
    });
    if (!clan?.chatThread) {
      throw new NotFoundException('Clan chat not found');
    }
    return this.sendMessage(clan.chatThread.id, input, principal);
  }

  async editMessage(
    messageId: string,
    input: EditMessageDto,
    principal: AuthPrincipal,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderUserId !== principal.claims.sub && !isAdmin(principal)) {
      throw new ForbiddenException('Only the sender can edit this message');
    }
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: input.content, editedAt: new Date() },
    });
    this.events.publish('chat.message.edited', {
      threadId: message.threadId,
      messageId,
    });
    return updated;
  }

  async deleteMessage(
    messageId: string,
    forEveryone: boolean,
    principal: AuthPrincipal,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.assertThreadParticipant(message.threadId, principal);
    if (forEveryone) {
      if (
        message.senderUserId !== principal.claims.sub &&
        !isAdmin(principal)
      ) {
        throw new ForbiddenException('Only the sender can delete for everyone');
      }
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });
    } else {
      await this.prisma.messageDeletion.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: principal.claims.sub,
          },
        },
        create: {
          messageId,
          userId: principal.claims.sub,
        },
        update: {},
      });
    }
    this.events.publish('chat.message.deleted', {
      threadId: message.threadId,
      messageId,
      forEveryone,
    });
    return { success: true };
  }

  async muteThread(threadId: string, principal: AuthPrincipal) {
    await this.assertThreadParticipant(threadId, principal);
    return this.prisma.chatParticipant.update({
      where: {
        threadId_userId: { threadId, userId: principal.claims.sub },
      },
      data: { isMuted: true },
    });
  }

  async unmuteThread(threadId: string, principal: AuthPrincipal) {
    await this.assertThreadParticipant(threadId, principal);
    return this.prisma.chatParticipant.update({
      where: {
        threadId_userId: { threadId, userId: principal.claims.sub },
      },
      data: { isMuted: false },
    });
  }

  async markThreadRead(
    threadId: string,
    input: MarkReadDto,
    principal: AuthPrincipal,
  ) {
    await this.assertThreadParticipant(threadId, principal);
    return this.prisma.chatParticipant.update({
      where: {
        threadId_userId: { threadId, userId: principal.claims.sub },
      },
      data: { lastReadAt: input.readAt ? new Date(input.readAt) : new Date() },
    });
  }

  async canReadThread(threadId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { threadId_userId: { threadId, userId } },
    });
    return { canRead: Boolean(participant) };
  }

  async isFriendsResponse(u: string, v: string) {
    return { isFriends: await this.areFriends(u, v) };
  }

  async isBlockedResponse(u: string, v: string) {
    return { isBlocked: await this.isBlockedEitherWay(u, v) };
  }

  private async ensureProfile(userId: string, db: DbClient = this.prisma) {
    await db.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await db.userPrivacySetting.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await db.userPresence.upsert({
      where: { userId },
      create: { userId, status: PresenceStatus.OFFLINE },
      update: {},
    });
  }

  private loadProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      include: this.profileInclude(),
    });
  }

  private async searchAuthDirectory(
    query: ListQueryDto,
    principal: AuthPrincipal,
  ): Promise<Map<string, AuthDirectoryUser>> {
    const search = query.query?.trim();
    if (!search) {
      return new Map();
    }

    const authLimit = Math.min(Math.max((query.limit ?? 25) * 4, 25), 100);
    const response = await this.authDirectory.searchUsers(
      {
        query: search,
        limit: authLimit,
      },
      principal.token,
    );

    return new Map(
      (response.items ?? []).map((user) => [user.id, user] as const),
    );
  }

  private buildUserSearchWhere(
    query?: string,
    authUserIds: string[] = [],
  ): Prisma.UserProfileWhereInput | undefined {
    const search = query?.trim();
    const filters: Prisma.UserProfileWhereInput[] = [];

    if (search) {
      filters.push({
        displayName: {
          contains: search,
          mode: 'insensitive',
        },
      });

      if (this.isUuid(search)) {
        filters.push({ userId: search });
      }
    }

    if (authUserIds.length > 0) {
      filters.push({ userId: { in: authUserIds } });
    }

    return filters.length > 0 ? { OR: filters } : undefined;
  }

  private async toProfileSearchView(
    profile: Prisma.UserProfileGetPayload<{
      include: ReturnType<SocialService['profileInclude']>;
    }>,
    viewerId: string,
    principal: AuthPrincipal,
    identity?: AuthDirectoryUser,
  ) {
    const view = await this.toProfileView(profile, viewerId, principal);

    if (!identity) {
      return view;
    }

    return {
      ...view,
      identity: {
        userId: identity.id,
        email: identity.email,
        username: identity.username ?? null,
      },
    };
  }

  private async toProfileView(
    profile: Prisma.UserProfileGetPayload<{
      include: ReturnType<SocialService['profileInclude']>;
    }>,
    viewerId: string,
    principal: AuthPrincipal,
  ) {
    const self = profile.userId === viewerId;
    const friend = self
      ? true
      : await this.areFriends(profile.userId, viewerId);
    const showPresence =
      self ||
      isAdmin(principal) ||
      this.canSeeByVisibility(
        profile.privacy?.lastSeenVisibility ?? 'FRIENDS',
        friend,
      );
    const redisOnline = await this.redis.isOnline(profile.userId);
    const presenceStatus = redisOnline
      ? PresenceStatus.ONLINE
      : (profile.presence?.status ?? PresenceStatus.OFFLINE);

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      country: profile.country,
      avatarUrl: profile.avatarFile?.deletedAt
        ? null
        : (profile.avatarFile?.publicPath ?? null),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      relationship: {
        self,
        friend,
      },
      privacy: self || isAdmin(principal) ? profile.privacy : undefined,
      presence: showPresence
        ? {
            status: presenceStatus,
            lastSeenAt: profile.presence?.lastSeenAt ?? null,
            updatedAt: profile.presence?.updatedAt ?? null,
          }
        : undefined,
    };
  }

  private profileInclude() {
    return {
      avatarFile: true,
      privacy: true,
      presence: true,
    } satisfies Prisma.UserProfileInclude;
  }

  private clanInclude() {
    return {
      avatarFile: true,
      _count: {
        select: {
          members: true,
        },
      },
      chatThread: true,
    } satisfies Prisma.ClanInclude;
  }

  private threadInclude(userId: string) {
    return {
      participants: true,
      clan: true,
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        where: { deletedAt: null },
      },
    } satisfies Prisma.ChatThreadInclude;
  }

  private toClanView(
    clan: Prisma.ClanGetPayload<{
      include: ReturnType<SocialService['clanInclude']>;
    }>,
  ) {
    return {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      ownerUserId: clan.ownerUserId,
      visibility: clan.visibility,
      joinPolicy: clan.joinPolicy,
      description: clan.description,
      avatarUrl: clan.avatarFile?.deletedAt
        ? null
        : (clan.avatarFile?.publicPath ?? null),
      chatThreadId: clan.chatThread?.id ?? null,
      memberCount: clan._count.members,
      createdAt: clan.createdAt,
      updatedAt: clan.updatedAt,
    };
  }

  private async assertCanSeeProfile(
    targetUserId: string,
    viewerId: string,
    principal: AuthPrincipal,
  ) {
    if (!(await this.canSeeProfile(targetUserId, viewerId, principal))) {
      throw new ForbiddenException('Profile is private');
    }
  }

  private async canSeeProfile(
    targetUserId: string,
    viewerId: string,
    principal: AuthPrincipal,
  ) {
    if (targetUserId === viewerId || isAdmin(principal)) {
      return true;
    }
    const privacy = await this.prisma.userPrivacySetting.findUnique({
      where: { userId: targetUserId },
    });
    const friend = await this.areFriends(targetUserId, viewerId);
    return this.canSeeByVisibility(
      privacy?.profileVisibility ?? 'PUBLIC',
      friend,
    );
  }

  private async assertCanViewFriends(userId: string, principal: AuthPrincipal) {
    if (userId === principal.claims.sub || isAdmin(principal)) {
      return;
    }
    const privacy = await this.prisma.userPrivacySetting.findUnique({
      where: { userId },
    });
    const friend = await this.areFriends(userId, principal.claims.sub);
    if (
      this.canSeeByVisibility(privacy?.friendsVisibility ?? 'FRIENDS', friend)
    ) {
      return;
    }
    throw new ForbiddenException('Friends list is private');
  }

  private canSeeByVisibility(visibility: string, friend: boolean): boolean {
    return (
      (visibility === 'PUBLIC' ||
        (visibility === 'FRIENDS' && friend) ||
        visibility === 'PRIVATE') &&
      visibility !== 'PRIVATE'
    );
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
      value,
    );
  }

  private assertSelfOrAdmin(userId: string, principal: AuthPrincipal) {
    if (userId !== principal.claims.sub && !isAdmin(principal)) {
      throw new ForbiddenException('You cannot manage this resource');
    }
  }

  private friendshipPair(a: string, b: string) {
    return a < b
      ? { userLowId: a, userHighId: b }
      : { userLowId: b, userHighId: a };
  }

  private async areFriends(a: string, b: string): Promise<boolean> {
    if (a === b) {
      return true;
    }
    const pair = this.friendshipPair(a, b);
    const friendship = await this.prisma.friendship.findUnique({
      where: { userLowId_userHighId: pair },
    });
    return Boolean(friendship);
  }

  private async isBlockedEitherWay(a: string, b: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return Boolean(block);
  }

  private async assertClanReadable(clanId: string, principal: AuthPrincipal) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (clan.visibility === 'PRIVATE' && !isAdmin(principal)) {
      await this.assertClanMember(clanId, principal.claims.sub);
    }
  }

  private async assertClanMember(clanId: string, userId: string) {
    const member = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('Clan membership is required');
    }
    return member;
  }

  private async assertClanAdmin(clanId: string, principal: AuthPrincipal) {
    if (isAdmin(principal)) {
      return;
    }
    const member = await this.assertClanMember(clanId, principal.claims.sub);
    if (member.role !== ClanRole.OWNER && member.role !== ClanRole.ADMIN) {
      throw new ForbiddenException('Clan admin role is required');
    }
  }

  private async isClanMember(clanId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    return Boolean(member);
  }

  private async addClanMemberFromRequest(
    clanId: string,
    userId: string,
    beforeCreate?: (tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    await this.ensureProfile(userId);
    return this.prisma.$transaction(async (tx) => {
      if (beforeCreate) {
        await beforeCreate(tx);
      }
      const membership = await tx.clanMember.upsert({
        where: { clanId_userId: { clanId, userId } },
        create: { clanId, userId, role: ClanRole.MEMBER },
        update: {},
      });
      const clan = await tx.clan.findUniqueOrThrow({
        where: { id: clanId },
        include: { chatThread: true },
      });
      if (clan.chatThread) {
        await tx.chatParticipant.upsert({
          where: {
            threadId_userId: {
              threadId: clan.chatThread.id,
              userId,
            },
          },
          create: {
            threadId: clan.chatThread.id,
            userId,
          },
          update: {},
        });
      }
      return membership;
    });
  }

  private async assertThreadParticipant(
    threadId: string,
    principal: AuthPrincipal,
  ) {
    if (isAdmin(principal)) {
      const thread = await this.prisma.chatThread.findUnique({
        where: { id: threadId },
      });
      if (!thread) {
        throw new NotFoundException('Thread not found');
      }
      return;
    }

    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: principal.claims.sub,
        },
      },
    });
    if (!participant) {
      throw new ForbiddenException('Thread membership is required');
    }
  }

  
}
