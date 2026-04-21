// @ts-ignore
import { Scene, Animation } from '@babylonjs/core';
// @ts-ignore
import { AdvancedDynamicTexture, Image } from '@babylonjs/gui';

export function fadeAnimation(scene: Scene, fadeIn: boolean) {
	const gui = AdvancedDynamicTexture.CreateFullscreenUI(
		"TextureGUI",
		true,
		scene,
	);
	const image = new Image("Starting Animation", "https://upload.wikimedia.org/wikipedia/commons/5/50/Black_colour.jpg");
	gui.addControl(image);
	const animation = new Animation(
		"fade",
		"alpha", 
		60, 
		Animation.ANIMATIONTYPE_FLOAT,
		Animation.ANIMATIONLOOPMODE_CONSTANT,
	);
	animation.setKeys([
		{ frame: 0,   value: fadeIn ? 1 : 0 },   // start: fully visible
		{ frame: 120, value: fadeIn ? 0 : 1 },   // end at frame 120 (2 seconds at 60fps)
	]);
	image.animations = [animation];
	scene.beginAnimation(image, 0, 120, false, 1, () => {
		image.dispose();
		gui.dispose();
	});
}