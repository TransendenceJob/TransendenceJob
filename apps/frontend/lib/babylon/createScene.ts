// @ts-ignore
import { Scene, FreeCamera, Vector3, HemisphericLight, Engine } from "@babylonjs/core";
// @ts-ignore
import { Socket } from 'socket.io-client';
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import createGui from "./createGui";
import setupSocket from "./setupSocket";
import { numPlayers, colors } from "./data/gameData";
import { points, spawnAreas } from "./data/vectorData";
import { Ground } from "./Ground";
import { spawnWorms } from "./Worm";
import { createCamera } from "./Camera";

export async function createScene(canvas: HTMLCanvasElement, engine: Engine, socket: Socket, msgToServer: string, DEBUG: boolean) {
	var scene = new Scene(engine);
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

	const gui = createGui(scene, canvas, socket);
	const ground = new Ground(scene, points);

	spawnWorms(scene, spawnAreas, numPlayers, colors);
	const cleanupSocket = setupSocket(socket, gui, DEBUG);

	return { scene, cleanupSocket };
};
