// Might need theese later, when game gets more complex. Currently arent included, cause they make compilation fail
//import "@babylonjs/core/Debug/debugLayer";
//import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON  from 'babylonjs';
import * as fs from 'fs';
import type { Response } from 'express';

enum LobbyStateEnum {
	ClosedLobby = 0,
	OpenLobby = 1,
	Loading = 2,
	Game = 3
}

/**
 * For a scene to be able to be rendered, it needs an engine, scene and a camera
 * Thats why we put them in the Lobbys properties
 * 
 * Coincidentally, the properties are the only place I found, 
 * where variables dont go out of scope for our functions and main loop
 */
export class GameLobby {
	private state: LobbyStateEnum;
	private engine: BABYLON.NullEngine;
	private scene: BABYLON.Scene;
	private camera: BABYLON.ArcRotateCamera;

	/**
	 * Not much to be said for this really
	 * We set up the bare minimum stuff for our Babylon Scene
	 * Then call the function that calls our main code
	 * Our main code (startLoop()) can run some stuff once,
	 * and then binds some code which handles our central loop,
	 * to the engine, which calls that code every frame
	 */
	constructor() {
		this.state = LobbyStateEnum.ClosedLobby;
		this.engine = new BABYLON.NullEngine();
		this.startLoop();
	}

	/**
	 * This is where we put code that is triggered only once (stuff like initial mesh creation, positioning, sizing etc)
	 */
	private startLoop() {
		this.engine.runRenderLoop(() => {
			this.gameServerLoop();
		});
	}

	/**
	 * This is where we would put our code that should be run each frame (Interactions, Inputs, Timers etc.)
	 */
	gameServerLoop() {
	}

	/**
	 * Just a random example function to show, that the server is running our scene and this code in the background
	 * Going to localhost:3000 when this application is live, will show the current counter
	 */
	accessLobby(res: Response) {
		switch (this.state) {
			case LobbyStateEnum.ClosedLobby :
				this.state++;
				this.lobbyClosed(res);
				break;
			case LobbyStateEnum.OpenLobby :
				this.state++;
				this.lobbyOpen(res);
				break;
			case LobbyStateEnum.Loading :
				this.state++;
				this.scene = new BABYLON.Scene(this.engine);
				this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), this.scene);
				this.lobbyloading(res);
				break;
			case LobbyStateEnum.Game :
				this.state = LobbyStateEnum.ClosedLobby;
				this.lobbyGame(res);
				break;
		}
	}

	lobbyClosed(res: Response) {
		res.send("Lobby closed!");
	}

	lobbyOpen(res: Response) {
		res.send("Lobby is open!");
	}

	lobbyloading(res: Response) {
		res.send("Lobby is loading");
	}

	lobbyGame(res: Response) {
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