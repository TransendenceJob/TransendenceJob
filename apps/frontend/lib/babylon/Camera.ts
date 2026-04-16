// @ts-ignore
import { Scene, Vector3, ArcRotateCamera } from "@babylonjs/core";

export function createCamera(scene: Scene, canvas: HTMLCanvasElement, pos_x: number, pos_y: number, max_distance: number)
{
	const camera = new ArcRotateCamera
	(
		"Camera",								// Name
		-Math.PI / 2,							// X-Rotation
		Math.PI / 2,							// Y-Rotation
		max_distance,							// Distance to Target
		new Vector3(pos_x, pos_y, 0),			// Target-position
		scene
	);
	camera.attachControl(canvas, true, false);
	camera.wheelPrecision = 20;
	camera.minZ = 0.3

	camera.lowerRadiusLimit = 2;				// Minimum Distance of Camera to target
	camera.upperRadiusLimit = max_distance;		// Maximum Distance of Camera to target
	
	camera.angularSensibilityX = 999999;		// No rotating Camera
	camera.angularSensibilityY = 999999;
	
	camera.useBouncingBehavior = false;			// Make right click pan camera
	camera.fov = 1


	scene.beforeRender = function ()			// Limit Camera Movement and zoom
	{
		const lower = camera.lowerRadiusLimit ?? 2;
		const upper = camera.upperRadiusLimit ?? max_distance;

		const width = upper * 0.74 -1.475;										// Formula based on total zoom to determine width when zoomed in
		const zoom_ratio = (1- ((camera.radius - lower) / (upper - lower)));	// Formula to calculate how zoomed in we are
		const xLimit = width * zoom_ratio;
		if (camera.target.x < -xLimit)
		camera.target.x = -xLimit;
		else if (camera.target.x > xLimit)
		camera.target.x = xLimit;
	}

	return (camera);
}