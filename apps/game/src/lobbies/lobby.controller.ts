import { Controller, Get, Res } from '@nestjs/common';
import { LobbyManager } from './LobbyManager';

@Controller()
export class LobbyController {
  constructor(private readonly lobbyManager: LobbyManager) {}

  /**
   * Outdated, frontend now serves files, as it should
   */
}
