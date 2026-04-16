import { Scene, Vector3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import earcut from "earcut";

export class Ground
{
	private scene: Scene;
	private points: Vector3[];
	private depth: number;
	private name: string;
	private groundMesh: Mesh | null;
	private physicsAggregate: PhysicsAggregate | null = null;

	constructor(scene: Scene, pointsArray: Vector3[])
    {
		this.scene = scene;
		this.points = pointsArray;
		this.depth = 1;
		this.name = "ground";
		if (this.points.length > 0) {
			this.groundMesh = MeshBuilder.ExtrudePolygon(
                this.name,
                {
                    shape: this.points,
                    depth: this.depth,
                },
                this.scene,
                earcut
            );
			this.groundMesh.rotation.x = -Math.PI / 2;
			this.groundMesh.position = new Vector3(-62, 0, -this.depth / 2);
			if (this.scene.isPhysicsEnabled()) {
				this.physicsAggregate = new PhysicsAggregate(this.groundMesh, PhysicsShapeType.MESH, { mass: 0 }, this.scene);
			} else {
				console.warn("Physics engine is not enabled on the scene. Ground physics aggregate skipped.");
			}
		}
		else
			this.groundMesh = null;
	}
}