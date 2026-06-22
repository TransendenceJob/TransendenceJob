import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ListQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class UpdatePrivacyDto {
  @IsOptional()
  @IsIn(['PUBLIC', 'FRIENDS', 'PRIVATE'])
  profileVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

  @IsOptional()
  @IsIn(['PUBLIC', 'FRIENDS', 'PRIVATE'])
  friendsVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

  @IsOptional()
  @IsIn(['PUBLIC', 'FRIENDS', 'PRIVATE'])
  lastSeenVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

  @IsOptional()
  @IsIn(['EVERYONE', 'FRIENDS', 'NONE'])
  dmPolicy?: 'EVERYONE' | 'FRIENDS' | 'NONE';
}

export class UpdatePresenceDto {
  @IsIn(['ONLINE', 'AWAY', 'BUSY', 'OFFLINE'])
  status!: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
}

export class CreateFriendRequestDto {
  @IsUUID()
  toUserId!: string;

  @IsOptional()
  @IsString()
  @Length(0, 240)
  message?: string;
}

export class CreateBlockDto {
  @IsUUID()
  blockedUserId!: string;
}

export class CreateClanDto {
  @IsString()
  @Length(3, 64)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(2, 8)
  tag?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsIn(['OPEN', 'INVITE_ONLY', 'REQUEST_ONLY'])
  joinPolicy?: 'OPEN' | 'INVITE_ONLY' | 'REQUEST_ONLY';

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class UpdateClanDto {
  @IsOptional()
  @IsString()
  @Length(3, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 8)
  tag?: string | null;

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsIn(['OPEN', 'INVITE_ONLY', 'REQUEST_ONLY'])
  joinPolicy?: 'OPEN' | 'INVITE_ONLY' | 'REQUEST_ONLY';

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string | null;
}

export class UpdateClanMemberDto {
  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'])
  role?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

  @IsOptional()
  @IsString()
  mutedUntil?: string | null;
}

export class CreateClanInviteDto {
  @IsUUID()
  invitedUserId!: string;
}

export class CreateJoinRequestDto {
  @IsOptional()
  @IsString()
  @Length(0, 240)
  message?: string;
}

export class CreateDmDto {
  @IsUUID()
  otherUserId!: string;
}

export class SendMessageDto {
  @IsString()
  @Length(1, 2000)
  content!: string;

  @IsOptional()
  @IsIn(['TEXT', 'GAME_INVITE'])
  contentType?: 'TEXT' | 'GAME_INVITE';

  @IsOptional()
  @IsString()
  @Length(1, 120)
  clientMessageId?: string;
}

export class EditMessageDto {
  @IsString()
  @Length(1, 2000)
  content!: string;
}

export class MarkReadDto {
  @IsOptional()
  @IsString()
  readAt?: string;
}

export class BooleanQueryDto {
  @IsUUID()
  u!: string;

  @IsUUID()
  v!: string;
}

export class DeleteMessageQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  forEveryone?: boolean;
}
