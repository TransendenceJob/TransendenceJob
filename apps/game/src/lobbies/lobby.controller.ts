import { Controller, Get, Res } from '@nestjs/common';
import { LobbyManager } from './LobbyManager';
import type { Response } from 'express';

@Controller()
export class LobbyController {
  constructor(private readonly lobbyManager: LobbyManager) {}

  /**
   * GET Requests to localhost:3000/lobby call this function
   * Here, we take reh Requests Response object that is automatically set up,
   * and put it as param into the function, so we can set it in there,
   * to the content we wanna give back
   */
  @Get('/lobby')
  getGame(@Res() res: Response) {
    this.lobbyManager.servePage(res);
  }
}
