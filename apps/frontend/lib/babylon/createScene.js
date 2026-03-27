import {
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
} from "@babylonjs/core";

import createGui from "./createGui";
import setupSocket from "./setupSocket";

export async function createScene(canvas, engine, socket, msgToServer, DEBUG) {
	var scene = new Scene(engine);
	var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
	camera.setTarget(Vector3.Zero());
	var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	const gui = createGui(scene, canvas, socket);
	setupSocket(socket, gui, msgToServer, DEBUG);

	return scene;
};
