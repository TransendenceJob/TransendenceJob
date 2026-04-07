// @ts-ignore
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight} from "@babylonjs/core";
// @ts-ignore
import { Socket } from 'socket.io-client';
import type { msgToServerType } from '../packets/msgToServerType';

import createGui from "./createGui";
import setupSocket from "./setupSocket";

export async function createScene(
								canvas: HTMLCanvasElement, 
								engine: Engine, 
								socket: Socket, 
								msgToServer: msgToServerType,
								DEBUG: boolean) {
	var scene = new Scene(engine);
	var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
	camera.setTarget(Vector3.Zero());
	var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	const gui = createGui(scene, canvas, msgToServer);
	const cleanupSocket = setupSocket(socket, gui, DEBUG);

	return { scene, cleanupSocket };
};
