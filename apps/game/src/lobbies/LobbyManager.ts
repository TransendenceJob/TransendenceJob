import { Injectable } from "@nestjs/common";
import { GameLobby } from './GameLobby';
import type { Response } from 'express';
import * as fs from 'fs';

@Injectable()
export class LobbyManager {
	private lobby: GameLobby = new GameLobby();

	/**
	 * Code for serving localhost:3000, all it does is call the 1 Lobby we have,
	 * and get some live counter for amount of frames it handled
	 */
	getCounter() {
		return (this.lobby.getCounter());
	}

	/**
	 * Code for serrving the client a static Babylon Scene from 
	 * ../gamefiles/raw.html
	 */
	serveGame(res: Response) {
		console.log(process.cwd());
		const filePath: string = process.cwd() + "/static_game_files/raw.html";
		try {
			const stat = fs.statSync(filePath);
			if (stat.isFile())
				return (res.sendFile(filePath));
		}
		catch {
			console.log(`Failed to load game file, path: ${filePath}`);
			return res.status(404).send("File not found");
		}
	}

}