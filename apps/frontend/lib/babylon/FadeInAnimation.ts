import { Scene, Animation } from '@babylonjs/core';
import { AdvancedDynamicTexture, Image } from '@babylonjs/gui';

export class FadeAnimation {
	private scene: Scene
	private image;
	private gui;
	private animation;
	constructor(scene: Scene) {
		this.scene = scene;
		this.gui = AdvancedDynamicTexture.CreateFullscreenUI(
			"TextureGUI",
			true,
			scene,
		);
		this.image = new Image("Starting Animation", "https://upload.wikimedia.org/wikipedia/commons/5/50/Black_colour.jpg");
		this.gui.addControl(this.image);
		this.animation = new Animation(
            "fadeOut",
            "alpha",         // property to animate
            60,              // keyframes per second
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
		this.animation.setKeys([
            { frame: 0,   value: 1 },   // start: fully visible
            { frame: 120, value: 0 },   // end at frame 120 (2 seconds at 60fps)
		]);
		this.image.animations = [this.animation];
	}

	start() {
		if (this.scene)
			this.scene.beginAninmation(this.image, 0, 120, false, 1);
	}
}