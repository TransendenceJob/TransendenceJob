export function createBoll(scene) {
	const backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", { width: 30, height: 30 }, scene);
	backgroundPlane.position = new BABYLON.Vector3(0, -4, 4); 
	backgroundPlane.rotation.x = (25 / 180 ) * Math.PI;
	backgroundPlane.material = new BABYLON.StandardMaterial("space", scene);
	backgroundPlane.material.diffuseTexture = new BABYLON.Texture("https://live.staticflickr.com/5173/5436446554_9244788c36_b.jpg", scene);
	backgroundPlane.material.emissiveTexture = backgroundPlane.material.diffuseTexture;
	backgroundPlane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
	backgroundPlane.material.disableLighting = true;

	var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 7, segments: 32}, scene);
	sphere.material = new BABYLON.StandardMaterial("main_material", scene);
	const textRock = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e1af5341-94c9-4f7c-b3b5-794f7b3ac690/d39vfot-603b0ab6-78e9-4ff5-a70a-5c63ee317dd2.jpg/v1/fill/w_894,h_894,q_70,strp/stone_texture___seamless_by_agf81_d39vfot-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9OTAwIiwicGF0aCI6Ii9mL2UxYWY1MzQxLTk0YzktNGY3Yy1iM2I1LTc5NGY3YjNhYzY5MC9kMzl2Zm90LTYwM2IwYWI2LTc4ZTktNGZmNS1hNzBhLTVjNjNlZTMxN2RkMi5qcGciLCJ3aWR0aCI6Ijw9OTAwIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.SPIlcN9JWCPtX6LUrCNeoctBo2Rl90GSenx8FqbNMkY";
	sphere.material.diffuseTexture = new BABYLON.Texture(textRock);
	let x = 0;
	let y = 0;
	let z = 0;
	const speed = Math.PI / 400;
	if (scene.actionManager == undefined)
		scene.actionManager = new BABYLON.ActionManager();
	scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
		BABYLON.ActionManager.OnEveryFrameTrigger,
		() => {
			x = (x + speed) % (Math.PI * 2);
			y = (y + speed / 2) % (Math.PI * 2);
			z = (z + speed / 4) % (Math.PI * 2);
			sphere.rotation = new BABYLON.Vector3(x, y, z)
		}
	));
	return (sphere);
}