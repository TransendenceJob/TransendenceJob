import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import type { AuthPrincipal } from '../auth/auth-principal';
import type { UpdateProfileDto } from './social.dto';
import type { PrismaService } from '../prisma/prisma.service';

type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

export type UserProfileWithAvatar = {
  displayName: string | null;
  avatarUrl: string | null;
};

export function assertImageFile(file: UploadedMemoryFile, maxBytes: number) {
  if (!file?.buffer || !file.mimetype) {
    throw new BadRequestException('Avatar file is required');
  }
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype)) {
    throw new BadRequestException('Avatar must be png, jpeg, webp, or gif');
  }
  if ((file.size ?? file.buffer.length) > maxBytes) {
    throw new BadRequestException('Avatar file is too large');
  }
}

export function extensionForMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return extensions[mimeType] ?? extname(mimeType);
}

/**
 * Save profile metadata first, then store the avatar file if provided.
 * Delegates to updateProfile and uploadAvatar; returns updated profile view.
 */
export async function saveProfileWithAvatarFile(
  userId: string,
  input: UpdateProfileDto,
  file: UploadedMemoryFile | undefined,
  updateProfile: (
    userId: string,
    input: UpdateProfileDto,
    principal: AuthPrincipal,
  ) => Promise<any>,
  uploadAvatar: (
    userId: string,
    file: UploadedMemoryFile,
    principal: AuthPrincipal,
  ) => Promise<any>,
  principal: AuthPrincipal,
): Promise<any> {
  const updatedProfile = await updateProfile(userId, input, principal);

  if (!file?.buffer) {
    return updatedProfile;
  }

  return uploadAvatar(userId, file, principal);
}

/**
 * Fetch a user's profile displayName and avatarUrl for use in match histories and other services.
 * Returns null values if user doesn't exist or profile is deleted.
 * Used by stats service to enrich MatchParticipant records.
 */
export async function getUserProfileWithAvatar(
  userId: string,
  prisma: PrismaService,
): Promise<UserProfileWithAvatar> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { avatarFile: true },
  });

  if (!profile) {
    return { displayName: null, avatarUrl: null };
  }

  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarFile?.deletedAt ? null : (profile.avatarFile?.publicPath ?? null),
  };
}
