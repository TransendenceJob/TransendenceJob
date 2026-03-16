import { createScene } from "./building/createScene";

export function main(document)
{
	const canvas = document.getElementById("renderCanvas");
	const engine = new BABYLON.Engine(canvas, true);

	const socket = io("ws://localhost:3003", {transports: ['websocket']});

	const scene = createScene(canvas, socket);

	engine.runRenderLoop(function () {
		scene.render();
	});

	window.addEventListener("resize", function () {
		engine.resize();
	});
}
