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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SocialService } from './social.service';

type RequestContext = {
  requestId?: string;
  authorization?: string;
};

@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('users/me/profile')
  getMyProfile(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.getMyProfile(this.context(requestId, authorization));
  }

  @Patch('users/me/profile')
  updateMyProfile(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.updateMyProfile(
      body,
      this.context(requestId, authorization),
    );
  }

  // Proxy the combined save request with avatar upload support.
  @Patch('users/me/profile/with-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  saveMyProfile(
    @Body() body: unknown,
    @UploadedFile() file: any,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
   
    return this.social.saveMyProfile(
      body,
      file,
      this.context(requestId, authorization),
    );
  }

  @Post('users/me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadMyAvatar(
    @UploadedFile() file: any,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.uploadMyAvatar(
      file,
      this.context(requestId, authorization),
    );
  }

  @Delete('users/me/avatar')
  deleteMyAvatar(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.deleteMyAvatar(this.context(requestId, authorization));
  }

  @Get('users/:userId/profile')
  getUserProfile(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.getUserProfile(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Get('users/search')
  searchUsers(
    @Query() query: Record<string, unknown>,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.searchUsers(
      query,
      this.context(requestId, authorization),
    );
  }

  @Get('users/me/privacy')
  getMyPrivacy(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.getMyPrivacy(this.context(requestId, authorization));
  }

  @Patch('users/me/privacy')
  updateMyPrivacy(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.updateMyPrivacy(
      body,
      this.context(requestId, authorization),
    );
  }

  @Get('friends')
  listFriends(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listFriends(this.context(requestId, authorization));
  }

  @Get('friends/requests/incoming')
  listIncomingFriendRequests(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listIncomingFriendRequests(
      this.context(requestId, authorization),
    );
  }

  @Get('friends/requests/outgoing')
  listOutgoingFriendRequests(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listOutgoingFriendRequests(
      this.context(requestId, authorization),
    );
  }

  @Post('friends/requests')
  createFriendRequest(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      '/internal/friend-requests',
      this.context(requestId, authorization),
      body,
    );
  }

  @Post('friends/requests/:requestId/accept')
  @HttpCode(200)
  acceptFriendRequest(
    @Param('requestId') requestId: string,
    @Headers('x-request-id') requestIdHeader?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/friend-requests/${encodeURIComponent(requestId)}/accept`,
      this.context(requestIdHeader, authorization),
    );
  }

  @Post('friends/requests/:requestId/decline')
  @HttpCode(200)
  declineFriendRequest(
    @Param('requestId') requestId: string,
    @Headers('x-request-id') requestIdHeader?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/friend-requests/${encodeURIComponent(requestId)}/decline`,
      this.context(requestIdHeader, authorization),
    );
  }

  @Post('friends/requests/:requestId/cancel')
  @HttpCode(200)
  cancelFriendRequest(
    @Param('requestId') requestId: string,
    @Headers('x-request-id') requestIdHeader?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/friend-requests/${encodeURIComponent(requestId)}/cancel`,
      this.context(requestIdHeader, authorization),
    );
  }

  @Delete('friends/:userId')
  removeFriend(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.removeFriend(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Get('blocks')
  listBlocks(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listBlocks(this.context(requestId, authorization));
  }

  @Post('blocks/:userId')
  blockUser(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      '/internal/blocks',
      this.context(requestId, authorization),
      { blockedUserId: userId },
    );
  }

  @Delete('blocks/:userId')
  removeBlock(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.removeBlock(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Post('clans')
  createClan(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      '/internal/clans',
      this.context(requestId, authorization),
      body,
    );
  }

  @Get('clans')
  listClans(
    @Query() query: Record<string, unknown>,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      '/internal/clans',
      this.context(requestId, authorization),
      undefined,
      query,
    );
  }

  @Get('clans/me')
  listMyClans(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listMyClans(this.context(requestId, authorization));
  }

  @Get('clans/me/invites')
  listMyClanInvites(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listMyClanInvites(
      this.context(requestId, authorization),
    );
  }

  @Get('clans/:clanId')
  getClan(
    @Param('clanId') clanId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      `/internal/clans/${encodeURIComponent(clanId)}`,
      this.context(requestId, authorization),
    );
  }

  @Patch('clans/:clanId')
  updateClan(
    @Param('clanId') clanId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'PATCH',
      `/internal/clans/${encodeURIComponent(clanId)}`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Delete('clans/:clanId')
  deleteClan(
    @Param('clanId') clanId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'DELETE',
      `/internal/clans/${encodeURIComponent(clanId)}`,
      this.context(requestId, authorization),
    );
  }

  @Get('clans/:clanId/members')
  listClanMembers(
    @Param('clanId') clanId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      `/internal/clans/${encodeURIComponent(clanId)}/members`,
      this.context(requestId, authorization),
    );
  }

  @Patch('clans/:clanId/members/:userId')
  updateClanMember(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'PATCH',
      `/internal/clans/${encodeURIComponent(clanId)}/members/${encodeURIComponent(userId)}`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Delete('clans/:clanId/members/:userId')
  removeClanMember(
    @Param('clanId') clanId: string,
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'DELETE',
      `/internal/clans/${encodeURIComponent(clanId)}/members/${encodeURIComponent(userId)}`,
      this.context(requestId, authorization),
    );
  }

  @Post('clans/:clanId/invites')
  createClanInvite(
    @Param('clanId') clanId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clans/${encodeURIComponent(clanId)}/invites`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Post('clans/invites/:inviteId/accept')
  @HttpCode(200)
  acceptClanInvite(
    @Param('inviteId') inviteId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clan-invites/${encodeURIComponent(inviteId)}/accept`,
      this.context(requestId, authorization),
    );
  }

  @Post('clans/invites/:inviteId/decline')
  @HttpCode(200)
  declineClanInvite(
    @Param('inviteId') inviteId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clan-invites/${encodeURIComponent(inviteId)}/decline`,
      this.context(requestId, authorization),
    );
  }

  @Post('clans/:clanId/join-requests')
  createJoinRequest(
    @Param('clanId') clanId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clans/${encodeURIComponent(clanId)}/join-requests`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Get('clans/:clanId/join-requests')
  listJoinRequests(
    @Param('clanId') clanId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      `/internal/clans/${encodeURIComponent(clanId)}/join-requests`,
      this.context(requestId, authorization),
    );
  }

  @Post('clans/join-requests/:requestId/approve')
  @HttpCode(200)
  approveJoinRequest(
    @Param('requestId') requestId: string,
    @Headers('x-request-id') requestIdHeader?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clan-join-requests/${encodeURIComponent(requestId)}/approve`,
      this.context(requestIdHeader, authorization),
    );
  }

  @Post('clans/join-requests/:requestId/reject')
  @HttpCode(200)
  rejectJoinRequest(
    @Param('requestId') requestId: string,
    @Headers('x-request-id') requestIdHeader?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/clan-join-requests/${encodeURIComponent(requestId)}/reject`,
      this.context(requestIdHeader, authorization),
    );
  }

  @Get('chats')
  listChats(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.listChats(this.context(requestId, authorization));
  }

  @Post('chats/dm')
  createOrGetDm(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      '/internal/chats/dm',
      this.context(requestId, authorization),
      body,
    );
  }

  @Get('chats/:threadId')
  getThread(
    @Param('threadId') threadId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      `/internal/chats/${encodeURIComponent(threadId)}`,
      this.context(requestId, authorization),
    );
  }

  @Get('chats/:threadId/messages')
  listMessages(
    @Param('threadId') threadId: string,
    @Query() query: Record<string, unknown>,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'GET',
      `/internal/chats/${encodeURIComponent(threadId)}/messages`,
      this.context(requestId, authorization),
      undefined,
      query,
    );
  }

  @Post('chats/:threadId/messages')
  sendMessage(
    @Param('threadId') threadId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/chats/${encodeURIComponent(threadId)}/messages`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Patch('messages/:messageId')
  editMessage(
    @Param('messageId') messageId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'PATCH',
      `/internal/messages/${encodeURIComponent(messageId)}`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Delete('messages/:messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @Query() query: Record<string, unknown>,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'DELETE',
      `/internal/messages/${encodeURIComponent(messageId)}`,
      this.context(requestId, authorization),
      undefined,
      query,
    );
  }

  @Post('chats/:threadId/mute')
  @HttpCode(200)
  muteThread(
    @Param('threadId') threadId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/chats/${encodeURIComponent(threadId)}/mute`,
      this.context(requestId, authorization),
    );
  }

  @Post('chats/:threadId/unmute')
  @HttpCode(200)
  unmuteThread(
    @Param('threadId') threadId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/chats/${encodeURIComponent(threadId)}/unmute`,
      this.context(requestId, authorization),
    );
  }

  @Post('chats/:threadId/read')
  @HttpCode(200)
  markThreadRead(
    @Param('threadId') threadId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.social.proxy(
      'POST',
      `/internal/chats/${encodeURIComponent(threadId)}/read`,
      this.context(requestId, authorization),
      body,
    );
  }

  @Get('uploads/avatars/:fileName')
  async getAvatar(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const file = await this.social.getAvatar(
      fileName,
      this.context(requestId, authorization),
    );
    if (file.contentType) {
      res.setHeader('Content-Type', file.contentType);
    }
    if (file.contentLength) {
      res.setHeader('Content-Length', file.contentLength);
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return file.streamable;
  }

  private context(requestId?: string, authorization?: string): RequestContext {
    return { requestId, authorization };
  }
}
