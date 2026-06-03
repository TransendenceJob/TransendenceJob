import { Mesh, MeshBuilder, PhysicsAggregate, PhysicsShape, PhysicsShapeType, Scene, StateCondition, Vector3 } from "@babylonjs/core";
import { StateMachine } from "../StateMachine";
import { ThinSSRBlurCombinerPostProcess } from "@babylonjs/core/PostProcesses/thinSSRBlurCombinerPostProcess";

export class Projectile {
	
	private speed: number = 1;
	
	public type: number = 0;
	public launchPos: Vector3 = Vector3.Zero();
	public launchAngle: number = 0;
	public endPos: Vector3 = Vector3.Zero();

	constructor()
	{
		
		// this.mesh.isVisible = false;
		// this.aggregate.body.setCollisionCallbackEnabled(false);
		// this.aggregate.shape.filterCollideMask = 0;
	}

	launchProjectile(scene: Scene)
	{
		const mesh = MeshBuilder.CreateSphere
		(
			"projectile",
			{ diameter: 0.2 },
			scene
		);

		const aggregate = new PhysicsAggregate
		(
			mesh,
			PhysicsShapeType.SPHERE,
			{ mass: 1 },
			scene
		);
		mesh.position = this.launchPos;


		const direction = new Vector3(
			Math.cos(this.launchAngle),
			Math.sin(this.launchAngle),
			0
		);

		const impulse = direction.scale(this.speed);

		// this.mesh.isVisible = true;
		// this.aggregate.body.setCollisionCallbackEnabled(true);

		aggregate.body.applyImpulse(
			impulse,
			mesh.getAbsolutePosition()
		);

		console.log("Of course i did xd!");
	}
}