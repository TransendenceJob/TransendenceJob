// @ts-ignore
import { Scene, FreeCamera, Vector3, HemisphericLight, Engine, ActionManager } from "@babylonjs/core";
// @ts-ignore
import { Socket } from 'socket.io-client';
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import { createCamera } from "./Camera";
import { msgToServerType } from "../packets/msgToServerType";
import { StateMachine } from './state/StateMachine';
import { MessageQueue } from './MessageQueue';

export async function createScene(
	canvas: HTMLCanvasElement, 
	engine: Engine, 
	socket: Socket, 
	msgToServer: msgToServerType, 
	lobbyId: number,
	DEBUG: boolean, 
) {
	var scene = new Scene(engine);
	scene.actionManager = new ActionManager(scene);
	var camera = createCamera(scene, canvas, 0, 0, 62);
	var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	try {
		const HavokPhysics = (await import("@babylonjs/havok")).default;
		const havokInterface = await HavokPhysics();
		const plugin = new HavokPlugin(undefined, havokInterface);
		scene.enablePhysics(new Vector3(0, -9.81, 0), plugin);
	} catch (error) {
		console.warn("Babylon physics plugin failed to initialize. Physics features will be disabled.", error);
	}

	let log = (data: string) => {};
	if (DEBUG) 
		log = (data: string) => {
			console.log(`BABYLON: ${data}`)
		};
	
	// Need to set up empty StateMachine so MessageQueue has something to reference
	const state = new StateMachine(canvas, scene, msgToServer, log);

	// Set up queue and socket before Game starts
	const queue = new MessageQueue(lobbyId, socket, state, DEBUG, log);

	// Then properly initialize and start the Game
	state.init(queue)

	const cleanup = () => {
		state.dispose();
		queue.dispose();
	}

	return { scene, cleanup };
};
