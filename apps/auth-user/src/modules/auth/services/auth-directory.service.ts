import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { UserSearchQueryDto } from '../contracts/dto/user-search-query.dto';
import { UserSearchResponseDto } from '../contracts/dto/user-search-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';

@Injectable()
export class AuthDirectoryService {
  constructor(private readonly users: UserRepository) {}

  async searchUsers(input: UserSearchQueryDto): Promise<UserSearchResponseDto> {
    const limit = input.limit ?? 20;
    const users = await this.users.searchActiveUsers({
      query: input.query,
      cursor: input.cursor,
      take: limit + 1,
    });

    const hasNextPage = users.length > limit;
    const pageItems = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1].id : null;

    return {
      items: pageItems.map((user) => AuthContractMapper.toUserAuthView(user)),
      pageInfo: AuthContractMapper.toPageInfo(nextCursor),
    };
  }
}
