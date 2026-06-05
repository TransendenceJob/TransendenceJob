import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  type AuditQueryDto,
  type DisableUserRequestDto,
  type EnableUserRequestDto,
  type RevokeSessionsRequestDto,
  type SetUserRolesRequestDto,
  type UpdatePlayerStatsDto,
  type UserSearchQueryDto,
} from './contracts/dto/auth-contracts.dto';
import { AuthService } from './auth.service';

type BffRequestContext = {
  requestId?: string;
  authorization: string;
};

@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  searchUsers(
    @Query() query: UserSearchQueryDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.searchUsers(
      query,
      this.context(requestId, authorization),
    );
  }

  @Get('users/:userId')
  getUser(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.getUser(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Post('users/:userId/disable')
  @HttpCode(200)
  disableUser(
    @Param('userId') userId: string,
    @Body() body: DisableUserRequestDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.disableUser(
      userId,
      body,
      this.context(requestId, authorization),
    );
  }

  @Post('users/:userId/enable')
  @HttpCode(200)
  enableUser(
    @Param('userId') userId: string,
    @Body() body: EnableUserRequestDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.enableUser(
      userId,
      body,
      this.context(requestId, authorization),
    );
  }

  @Post('users/:userId/role')
  @HttpCode(200)
  setUserRoles(
    @Param('userId') userId: string,
    @Body() body: SetUserRolesRequestDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.setUserRoles(
      userId,
      body,
      this.context(requestId, authorization),
    );
  }

  @Post('users/:userId/sessions/revoke')
  @HttpCode(200)
  revokeUserSessions(
    @Param('userId') userId: string,
    @Body() body: RevokeSessionsRequestDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.revokeUserSessions(
      userId,
      body,
      this.context(requestId, authorization),
    );
  }

  @Get('audit')
  listAuditLogs(
    @Query() query: AuditQueryDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.listAuditLogs(
      query,
      this.context(requestId, authorization),
    );
  }

  @Get('users/:userId/stats')
  getUserStats(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.getPlayerStats(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Put('users/:userId/stats')
  updateUserStats(
    @Param('userId') userId: string,
    @Body() body: UpdatePlayerStatsDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.updatePlayerStats(
      userId,
      body,
      this.context(requestId, authorization),
    );
  }

  private context(
    requestId?: string,
    authorization?: string,
  ): BffRequestContext {
    if (!authorization) {
      throw new UnauthorizedException();
    }

    return { requestId, authorization };
  }
}
