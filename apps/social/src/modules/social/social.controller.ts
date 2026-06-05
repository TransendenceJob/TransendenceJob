import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import type { AuthPrincipal } from '../auth/auth-principal';
import { SocialService } from './social.service';
import {
  BooleanQueryDto,
  CreateBlockDto,
  CreateClanDto,
  CreateClanInviteDto,
  CreateDmDto,
  CreateFriendRequestDto,
  CreateJoinRequestDto,
  DeleteMessageQueryDto,
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

@UseGuards(BearerAuthGuard)
@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('users/:userId/profile')
  getProfile(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.getProfile(userId, principal);
  }

  @Patch('users/:userId/profile')
  updateProfile(
    @Param('userId') userId: string,
    @Body() body: UpdateProfileDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.updateProfile(userId, body, principal);
  }

  // Save profile metadata and avatar in one request.
  @Patch('users/:userId/profile/with-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  saveProfile(
    @Param('userId') userId: string,
    @Body() body: UpdateProfileDto,
    @UploadedFile() file: any,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.saveProfile(userId, body, file, principal);
  }

  @Get('users/search')
  searchUsers(
    @Query() query: ListQueryDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.searchUsers(query, principal);
  }

  @Get('users/:userId/privacy')
  getPrivacy(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.getPrivacy(userId, principal);
  }

  @Patch('users/:userId/privacy')
  updatePrivacy(
    @Param('userId') userId: string,
    @Body() body: UpdatePrivacyDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.updatePrivacy(userId, body, principal);
  }

  @Patch('users/:userId/presence')
  updatePresence(
    @Param('userId') userId: string,
    @Body() body: UpdatePresenceDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.updatePresence(userId, body, principal);
  }

  @Post('users/:userId/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: any,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.uploadAvatar(userId, file, principal);
  }

  @Delete('users/:userId/avatar')
  deleteAvatar(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.deleteAvatar(userId, principal);
  }

  @Get('friends/:userId')
  listFriends(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listFriends(userId, principal);
  }

  @Post('friend-requests')
  createFriendRequest(
    @Body() body: CreateFriendRequestDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createFriendRequest(body, principal);
  }

  @Get('friend-requests/incoming/:userId')
  listIncomingFriendRequests(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listIncomingFriendRequests(userId, principal);
  }

  @Get('friend-requests/outgoing/:userId')
  listOutgoingFriendRequests(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listOutgoingFriendRequests(userId, principal);
  }

  @Post('friend-requests/:requestId/accept')
  @HttpCode(200)
  acceptFriendRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.acceptFriendRequest(requestId, principal);
  }

  @Post('friend-requests/:requestId/decline')
  @HttpCode(200)
  declineFriendRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.declineFriendRequest(requestId, principal);
  }

  @Post('friend-requests/:requestId/cancel')
  @HttpCode(200)
  cancelFriendRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.cancelFriendRequest(requestId, principal);
  }

  @Delete('friends/:userId/:otherUserId')
  removeFriend(
    @Param('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.removeFriend(userId, otherUserId, principal);
  }

  @Get('blocks/:userId')
  listBlocks(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listBlocks(userId, principal);
  }

  @Post('blocks')
  createBlock(
    @Body() body: CreateBlockDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createBlock(body, principal);
  }

  @Delete('blocks/:userId/:blockedUserId')
  removeBlock(
    @Param('userId') userId: string,
    @Param('blockedUserId') blockedUserId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.removeBlock(userId, blockedUserId, principal);
  }

  @Get('social/is-friends')
  isFriends(@Query() query: BooleanQueryDto) {
    return this.social.isFriendsResponse(query.u, query.v);
  }

  @Get('social/is-blocked')
  isBlocked(@Query() query: BooleanQueryDto) {
    return this.social.isBlockedResponse(query.u, query.v);
  }

  @Post('clans')
  createClan(
    @Body() body: CreateClanDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createClan(body, principal);
  }

  @Get('clans')
  listClans(@Query() query: ListQueryDto) {
    return this.social.listClans(query);
  }

  @Get('clans/:clanId')
  getClan(
    @Param('clanId') clanId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.getClan(clanId, principal);
  }

  @Patch('clans/:clanId')
  updateClan(
    @Param('clanId') clanId: string,
    @Body() body: UpdateClanDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.updateClan(clanId, body, principal);
  }

  @Delete('clans/:clanId')
  deleteClan(
    @Param('clanId') clanId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.deleteClan(clanId, principal);
  }

  @Get('clans/by-user/:userId')
  listClansByUser(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listClansByUser(userId, principal);
  }

  @Get('clans/:clanId/members')
  listClanMembers(
    @Param('clanId') clanId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listClanMembers(clanId, principal);
  }

  @Get('clans/:clanId/members/:userId')
  getClanMembership(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.getClanMembership(clanId, userId, principal);
  }

  @Patch('clans/:clanId/members/:userId')
  updateClanMember(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateClanMemberDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.updateClanMember(clanId, userId, body, principal);
  }

  @Delete('clans/:clanId/members/:userId')
  removeClanMember(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.removeClanMember(clanId, userId, principal);
  }

  @Post('clans/:clanId/invites')
  createClanInvite(
    @Param('clanId') clanId: string,
    @Body() body: CreateClanInviteDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createClanInvite(clanId, body, principal);
  }

  @Get('clan-invites/by-user/:userId')
  listClanInvitesByUser(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listClanInvitesByUser(userId, principal);
  }

  @Post('clan-invites/:inviteId/accept')
  @HttpCode(200)
  acceptClanInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.acceptClanInvite(inviteId, principal);
  }

  @Post('clan-invites/:inviteId/decline')
  @HttpCode(200)
  declineClanInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.declineClanInvite(inviteId, principal);
  }

  @Post('clans/:clanId/join-requests')
  createJoinRequest(
    @Param('clanId') clanId: string,
    @Body() body: CreateJoinRequestDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createJoinRequest(clanId, body, principal);
  }

  @Get('clans/:clanId/join-requests')
  listJoinRequests(
    @Param('clanId') clanId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listJoinRequests(clanId, principal);
  }

  @Post('clan-join-requests/:requestId/approve')
  @HttpCode(200)
  approveJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.approveJoinRequest(requestId, principal);
  }

  @Post('clan-join-requests/:requestId/reject')
  @HttpCode(200)
  rejectJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.rejectJoinRequest(requestId, principal);
  }

  @Get('clans/:clanId/is-member/:userId')
  isClanMember(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
  ) {
    return this.social.isClanMemberResponse(clanId, userId);
  }

  @Get('chats/by-user/:userId')
  listThreads(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listThreads(userId, principal);
  }

  @Post('chats/dm')
  createOrGetDm(
    @Body() body: CreateDmDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.createOrGetDm(body, principal);
  }

  @Get('chats/:threadId')
  getThread(
    @Param('threadId') threadId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.getThread(threadId, principal);
  }

  @Get('chats/:threadId/messages')
  listMessages(
    @Param('threadId') threadId: string,
    @Query() query: ListQueryDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.listMessages(threadId, query, principal);
  }

  @Post('chats/:threadId/messages')
  sendMessage(
    @Param('threadId') threadId: string,
    @Body() body: SendMessageDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.sendMessage(threadId, body, principal);
  }

  @Patch('messages/:messageId')
  editMessage(
    @Param('messageId') messageId: string,
    @Body() body: EditMessageDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.editMessage(messageId, body, principal);
  }

  @Delete('messages/:messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @Query() query: DeleteMessageQueryDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.deleteMessage(
      messageId,
      Boolean(query.forEveryone),
      principal,
    );
  }

  @Post('chats/:threadId/mute')
  @HttpCode(200)
  muteThread(
    @Param('threadId') threadId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.muteThread(threadId, principal);
  }

  @Post('chats/:threadId/unmute')
  @HttpCode(200)
  unmuteThread(
    @Param('threadId') threadId: string,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.unmuteThread(threadId, principal);
  }

  @Post('chats/:threadId/read')
  @HttpCode(200)
  markThreadRead(
    @Param('threadId') threadId: string,
    @Body() body: MarkReadDto,
    @CurrentUser() principal: AuthPrincipal,
  ) {
    return this.social.markThreadRead(threadId, body, principal);
  }

  @Get('chats/:threadId/can-read/:userId')
  canReadThread(
    @Param('threadId') threadId: string,
    @Param('userId') userId: string,
  ) {
    return this.social.canReadThread(threadId, userId);
  }
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly social: SocialService) {}

  @Get('avatars/:fileName')
  async getAvatar(
    @Param('fileName') fileName: string,
    @Headers('if-none-match') _etag: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.social.openAvatar(fileName);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return new StreamableFile(file.stream);
  }
}
