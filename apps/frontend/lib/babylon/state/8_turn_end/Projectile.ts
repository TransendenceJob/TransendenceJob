import { Mesh, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShape, PhysicsShapeType, Scene, StateCondition, Vector3 } from "@babylonjs/core";
import { StateMachine } from "../StateMachine";
import { ThinSSRBlurCombinerPostProcess } from "@babylonjs/core/PostProcesses/thinSSRBlurCombinerPostProcess";

export class Projectile {
	
	private speed: number = 10000000;
	
	public type: number = 0;
	public launchPos: Vector3 = Vector3.Zero();
	public launchAngle: number = 0;
	public endPos: Vector3 = Vector3.Zero();

	// public mesh: Mesh;
	// public aggregate: PhysicsAggregate;

	constructor() {}

	launchProjectile(scene: Scene)
	{
		const mesh = MeshBuilder.CreateSphere
		(
			"projectile",
			{ diameter: 0.5 },
			scene
		);
		mesh.position = this.launchPos;

		const aggregate = new PhysicsAggregate
		(
			mesh,
			PhysicsShapeType.SPHERE,
			{ mass: 1, restitution: 0, friction: 50 },
			scene
		);
		aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
		mesh.isVisible = true;

		console.log(`Received angle: ${this.launchAngle / Math.PI * 180}, turned into ${mesh.rotation.z / Math.PI * 180}`);

		// this.mesh.isVisible = true;
		// this.aggregate.body.setCollisionCallbackEnabled(true);

		const direction2 = new Vector3(Math.sin(this.launchAngle), Math.cos(this.launchAngle), 0);
		console.log("We go in", direction2);
		aggregate.body.applyImpulse(direction2.scale(this.speed), mesh.getAbsolutePosition());

		console.log("Launch position: ", this.launchPos);
		console.log("Mesh position: ", mesh.position);
		console.log("Launch angle: ", mesh.rotation.z);
		console.log("Of course i did xd!");
	}
}