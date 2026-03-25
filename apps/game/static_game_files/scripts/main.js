import { createScene } from "../building/createScene";

export function main(document)
{
	const canvas = document.getElementById("renderCanvas"); // Get the canvas element
	const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
	const socket = io("ws://localhost:8080", {transports: ['websocket']});
	const scene = createScene(canvas, socket);
	engine.runRenderLoop(function () {
		scene.render();
	});
	window.addEventListener("resize", function () {
		engine.resize();
	});
}
