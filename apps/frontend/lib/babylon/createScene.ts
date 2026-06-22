import { Scene, Vector3, HemisphericLight, Engine, ActionManager } from "@babylonjs/core";
import { Socket } from 'socket.io-client';
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { RefObject } from 'react';

import { createCamera } from "./Camera";
import { msgToServerType } from "../packets/msgToServerType";
import { StateMachine } from './state/StateMachine';
import { MessageQueue } from './MessageQueue';
import { CLIENT_GENERAL_OUTPUT } from "@/shared/packets/config";

export async function createScene(
	canvas: HTMLCanvasElement, 
	engine: Engine, 
	socketRef: RefObject<Socket | null>,
	msgToServer: msgToServerType, 
	lobbyId: number,
	userId: string,
) {
	const scene = new Scene(engine);
	scene.actionManager = new ActionManager(scene);

	if (socketRef.current == null)
		return ({
			scene: scene,
			resizeUi: () => {},
			cleanup: () => {},
		});
	const socket: Socket = socketRef.current;
	const camera = createCamera(scene, canvas, 0, 0, 80);
	const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	try {
		const HavokPhysics = (await import("@babylonjs/havok")).default;
		const havokInterface = await HavokPhysics();
		const plugin = new HavokPlugin(undefined, havokInterface);
		scene.enablePhysics(new Vector3(0, -50, 0), plugin);
	} catch (error) {
		console.warn("Babylon physics plugin failed to initialize. Physics features will be disabled.", error);
	}

	let log = (data: string) => {};
	if (CLIENT_GENERAL_OUTPUT) 
		log = (data: string) => {
			console.log(`BABYLON: ${data}`)
		};
	
	// Need to set up empty StateMachine so MessageQueue has something to reference
	const state = new StateMachine(canvas, scene, msgToServer, userId, log);

	// Set up queue and socket before Game starts
	const queue = new MessageQueue(lobbyId, socket, state, CLIENT_GENERAL_OUTPUT, log);

	// Then properly initialize and start the Game
	state.init(queue);

	const resizeUi = () => {
		state.guiHelper?.resize();
	}

	const cleanup = () => {
		state.dispose();
		queue.dispose();
	}


	return { scene, resizeUi, cleanup };
};
