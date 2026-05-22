import { Scene, Vector2, Vector3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import earcut from "earcut";
import { mapData, pointData } from '@/shared/packets/util';

function mapDataToVector3(data: mapData) {
	const result = new Array<Vector3>();
	data.points.forEach((point: pointData) => {
		result.push(new Vector3(point.x, 0, point.y));
	})
	return (result);
}

/**
 * raw angle formula derived from https://wumbo.net/formulas/angle-between-two-vectors-2d/
 * Uses vector(0, 1) to compare against
 * @param Vector
 * @returns Angle in radians, 0 meaning straight up, increasing angle turns counter-clockwise
*/
function angle(target: Vector2) {
	const raw_angle = Math.atan2(target.x, target.y);
	const adjusted_angle = ((Math.PI * 2) - raw_angle) % (Math.PI * 2)
	return (adjusted_angle);
}

export class Ground
{
	private scene: Scene;
	private points: Vector3[];
	private depth: number;
	private name: string;
	private DEBUG: boolean;
	private groundMesh: Mesh | null;
	private physicsAggregate: PhysicsAggregate | null = null;

	constructor(scene: Scene, points: mapData, DEBUG: boolean = false)
    {
		this.scene = scene;
		this.points = mapDataToVector3(points);
		this.depth = 1;
		this.name = "ground";
		this.DEBUG = DEBUG;
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
			// Position should be 0, 0, -depth/2
			this.groundMesh.position = new Vector3(0, 0, -this.depth / 2);
			if (this.scene.isPhysicsEnabled()) {
				this.physicsAggregate = new PhysicsAggregate(this.groundMesh, PhysicsShapeType.MESH, { mass: 0 }, this.scene);
			} else {
				console.warn("Physics engine is not enabled on the scene. Ground physics aggregate skipped.");
			}
		}
		else
			this.groundMesh = null;
	}


/**
	 * @brief Register an explosion and recalculate array and mesh
	 * @param explosionX number x coordinate of explosion center
	 * @param explosionY number y coordinate of explosion center
	 * @param radius number radius of the explosion
	 */
	affectTerrain(explosionX: number, explosionY: number, radius: number) {
		const array = this.points;
		const explosionPoint = new Vector2(explosionX, explosionY);
		const len = array.length;
		let startIndex = -1;
		
		// Find point that is outside the explosion to keep walking through array
		for (let i = 0; i < len; i++) {
			if (!this.insideExploCheck(array[i].x, array[i].z, explosionPoint, radius)) {
				startIndex = i;
				break ;
			}
		}
		
		// Explosion consumes entire mesh
		if (startIndex == -1) {
			this.makeGround([]);
			return ;
		}
		
		const newArray = [];
		let insideExplosion = false;

		// Go through all Vectors that make up the map
		for (let i = 0; i < len; i++) {
			const currentIndex = (startIndex + i) % len;
			const nextIndex = (startIndex + i + 1) % len;

			const point1 = new Vector2(array[currentIndex].x, array[currentIndex].z);
			const point2 = new Vector2(array[nextIndex].x, array[nextIndex].z);
			const intersectPoints = this.checkIntersection(point1, point2, explosionPoint, radius, 0.00001);

			if (!insideExplosion) {
				newArray.push(new Vector3(point1.x, 0, point1.y));
				if (intersectPoints.length == 1) {
					insideExplosion = true;
					newArray.push(new Vector3(intersectPoints[0].x, 0, intersectPoints[0].y));
				}
				else if (intersectPoints.length === 2) {
					newArray.push(new Vector3(intersectPoints[0].x, 0, intersectPoints[0].y));
					this.onExitingExplo(newArray, explosionPoint, intersectPoints[1], radius);
				}
			}
			else if (intersectPoints.length == 1) {
					insideExplosion = false;
					this.onExitingExplo(newArray, explosionPoint, intersectPoints[0], radius);
			}
		}
		this.makeGround(newArray);
	}


	/**
	 * @brief Create new ground mesh based on given array
	 * @param newArray Array of BABYLON.Vector3 representing the points along the curve of the mesh
	 */
	makeGround(newArray: Array<Vector3>) {
		// Get rid of old ground mesh
		if (this.physicsAggregate != null) {
			this.physicsAggregate.dispose();
			this.physicsAggregate = null;
		}
		if (this.groundMesh != null) {
			this.groundMesh.dispose();
			this.groundMesh = null;
		}

		// Use new Array
		this.points = newArray;
		
		// For empty arrays dont create a mesh
		if (this.points.length == 0)
			return ;

		// Move counter clockwise, building mesh from array
		
		this.groundMesh = MeshBuilder.ExtrudePolygon(this.name, {shape: this.points, depth: this.depth}, this.scene, earcut);
		this.groundMesh.rotation.x = -Math.PI / 2;
		this.groundMesh.position = new Vector3(0, 0, -this.depth / 2);
		this.physicsAggregate = new PhysicsAggregate(this.groundMesh, PhysicsShapeType.MESH, { mass: 0 }, this.scene);
	}


	/**
	* @brief Fills newArray with points along curved surface
	* @param newArray Array of BABYLON.Vector3 that represents the new map, last entry should be the point where the explosion begins
	* @param explostionPoint Vector to where explosion is
	* @param exitPoint Vector with coordinates, where line exits explosion
	* @param radius number for radius of explosion
	*/
	onExitingExplo(newArray: Array<Vector3>, explosionPoint: Vector2, exitPoint: Vector2, radius: number) {
		// Prepare vectors for crossproduct
		const entryPoint = new Vector2(newArray[newArray.length - 1].x, newArray[newArray.length - 1].z);
		const exploToEntry = entryPoint.subtract(explosionPoint);
		const exploToExit = exitPoint.subtract(explosionPoint);

		// Get angles of entrance and middle point
		const tessalationCount = 20;
		const startAngle = angle(exploToEntry);
		const endAngle = angle(exploToExit);
		let angleDiff = endAngle - startAngle;
		// Adjust so rotation always goes clockwise (meaning rotating INTO the mesh)
		if (angleDiff > 0)
			angleDiff -= Math.PI * 2;

		// Divide the shortest path by the steps
		const angleEachStep = angleDiff  / (tessalationCount);

		// Walk along explosions surface, putting tesselationCount points into the newArray
		for (let i = 1; i < tessalationCount; i++) {
			newArray.push(new Vector3(
				-Math.sin(startAngle + angleEachStep * i) * radius + explosionPoint.x,
				0, 
				Math.cos(startAngle + angleEachStep * i) * radius + explosionPoint.y
			));
		}
		newArray.push(new Vector3(exitPoint.x, 0, exitPoint.y));
	}


	/**
	 * @brief Quickly check, if the given point is inside the Explosion
	 * @param firstX number for x coordinate of point
	 * @param firstY number for y coordinate of point
	 * @param explosionPoint Vector representing center point of explosion
	 * @param radius number for radius of explosion
	 * @returns true if point is inside explosion, false otherwise
	 */
	insideExploCheck(firstX: number, firstY: number, explosionPoint: Vector2, radius: number) {
		const point1 = new Vector2(firstX, firstY);
		point1.subtractInPlace(explosionPoint);
		if (point1.length() <= radius)
			return (true);
		return (false);
	}


	/**
	 * @brief Check where line intersects circle
	 * @param point1 Vector to start point of line
	 * @param point2 Vector to end point of line
	 * @param exploPoint Vector to point of center of circle
	 * @param radius number representing size of circle
	 * @returns Array of 0-2 Vectors pointing to Intersection points of circle and line
	 * @note For more details on this calculation, look at "Notes Circle Line Intersection.txt"
	 */
	checkIntersection(point1: Vector2, point2: Vector2, exploPoint: Vector2, radius: number, tolerance: number) {
		// Calculate helper values
		const V = point2.subtract(point1);
		const D = point1.subtract(exploPoint);

		// Get values for midnight formula
		const a = V.dot(V);
		const b = V.dot(D) * 2;
		const c = D.dot(D) - radius * radius;

		// Provided by AI, supposedly helps with edge cases
		const discriminant = b * b -4 * a * c;
		if (discriminant < 0) return [];

		// Insert into midnight formula
		const sqrtofDisc = Math.sqrt(b*b - 4 * a * c)
		const fact1 = (-b + sqrtofDisc)/(2 * a);
		const fact2 = (-b - sqrtofDisc)/(2 * a);

		// Take intersection fractions, turn them into points, and put them in an array
		const results = [];
		const sortedFactors = [fact1, fact2].sort((x, y) => x - y);
		for (const factor of sortedFactors) {
			if (factor >= -tolerance && factor <= 1 + tolerance) {
				const clampedFactor = Math.max(0, Math.min(1, factor));
				results.push(V.scale(clampedFactor).add(point1));
			}
		}
		return (results);
	}


	dispose() {
		this.physicsAggregate?.dispose();
		this.groundMesh?.dispose();
	}
}

