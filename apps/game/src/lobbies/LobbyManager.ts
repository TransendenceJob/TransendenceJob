import { Injectable } from "@nestjs/common";
import { GameLobby } from './GameLobby';
import type { Response } from 'express';

@Injectable()
export class LobbyManager {
	private lobby: GameLobby = new GameLobby();

	/**
	 * Code for serrving the client a static Babylon Scene from 
	 * ../gamefiles/raw.html
	 */
	serveGame(res: Response) {
		this.lobby.accessLobby(res);
	}

}
