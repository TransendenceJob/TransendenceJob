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
export class Lobby {
	public state: LobbyStateEnum;
	public lobbyId: number;
	private engine: BABYLON.NullEngine;
	private scene: BABYLON.Scene;
	private camera: BABYLON.ArcRotateCamera;

	/**
	 * On Lobby Creation, call the constructor,
	 * which sets up the basic data and calls functions,
	 * to register loops
	 * @param id unique number identifier for this lobby
	 */
	constructor(id) {
		this.state = LobbyStateEnum.ClosedLobby;
		this.lobbyId = id;
		this.engine = new BABYLON.NullEngine();
		this.scene = new BABYLON.Scene(this.engine);
		this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), this.scene);
		this.registerLoop();
	}

	/**
	 * This is where we put code that is triggered only once (stuff like initial mesh creation, positioning, sizing etc)
	 */
	private registerLoop() {
		this.engine.runRenderLoop(() => {
			// This calls the Babylon Renderer
			this.scene.render();

			// This is where we can register custom code
			this.gameServerLoop();
		});
	}

	/**
	 * This is where we would put our code that should be run each frame (Interactions, Inputs, Timers etc.)
	 */
	gameServerLoop() {

	}

	/**
	 * Called when the lobby is requested from the client
	 * Serves the files for each state
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
				this.lobbyloading(res);
				break;
			case LobbyStateEnum.Game :
				this.state = LobbyStateEnum.ClosedLobby;
				this.lobbyGame(res);
				break;
		}
	}

	lobbyClosed(res: Response) {
		res.send("Lobby closed (Reload to move to next state)");
	}

	lobbyOpen(res: Response) {
		res.send("Lobby is open (Reload to move to next state)");
	}

	lobbyloading(res: Response) {
		res.send("Lobby is loading (Reload to move to next state)");
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