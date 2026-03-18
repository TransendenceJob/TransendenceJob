import { Injectable } from "@nestjs/common";
import { Lobby } from './Lobby';
import type { Response } from 'express';

/**
 * Service that administrates multiple lobbies at the same time
 * Since we only plan on using 1, this is just passing stuff through
 */

@Injectable()
export class LobbyManager {
	private lobbies: Lobby[];
	constructor () {
		const amount = 1;
		this.lobbies = new Array(amount);
		for (let i = 0; i < amount; i++)
			this.lobbies[i] = new Lobby(i);
	}

	serveLobby(res: Response) {
		this.lobbies[0].accessLobby(res);
	}

}
