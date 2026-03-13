import { Controller, Get, Res, Req } from '@nestjs/common';
import { LobbyManager } from './lobbies/LobbyManager';
import type { Response } from 'express';

@Controller()
export class ServerController {
constructor(private readonly lobbyManager: LobbyManager) {}


/**
 * GET Requests to localhost:3000 call this function
 * This is just for displaying, that out server is running in the background,
 * and that its going through frames, where it could do stuff
 */
@Get()
getHello(): string {
	return("Current Counter: " + this.lobbyManager.getCounter());
}

/**
 * GET Requests to localhost:3000/game call this function
 * Here, we take reh Requests Response object that is automatically set up,
 * and put it as param into the function, so we can set it in there,
 * to the content we wanna give back
 */
@Get("/game")
getGame(@Res() res: Response) {
		this.lobbyManager.serveGame(res);
	}
}