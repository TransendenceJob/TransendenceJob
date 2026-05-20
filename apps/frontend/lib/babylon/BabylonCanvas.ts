export interface mapData {
	points: Array<Array<pointData>>
}

export interface pointData {
	x: number,
	y: number,
}

/**
 * Represents 1 island of the map
 * @param points Vectors that make up this island
 * @param mesh Mesh of this island
 * @param physics Physics Aggregate for the map, may be null if no physics engine
 */
interface PointMap {
    points: Array<BABYLON.Vector3>,
    mesh: BABYLON.Mesh,
    physics: BABYLON.PhysicsAggregate | null,
}

/**
 * Represents 2 points where the map intersects an explosion
 * @param entry Point where Map enters into explosion radius
 * @param exit Point where Map exist out of explosion radius
 * @param insertIndex
 */
interface IntersectionPoints {
    entry: pointData,
    exit: pointData,
    insertIndex: number,
}

function createPointMap(vectors: Array<BABYLON.Vector3>, scene: BABYLON.Scene) {
    const mesh = BABYLON.MeshBuilder.ExtrudePolygon(
        // Add counting numbers to this
        "Ground",
        {
            shape: vectors,
            depth: 1,
        },
        scene
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position = new BABYLON.Vector3(0, 0, -1 / 2);

    let physics: BABYLON.PhysicsAggregate | null = null;
    if (scene.isPhysicsEnabled()) {
        physics = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);
    } else {
        console.warn("Physics engine is not enabled on the scene. Ground physics aggregate skipped.");
    }
    
    return ({
        points: vectors,
        mesh: mesh,
        physics: physics
    });
}

export class Ground
{
	private scene: BABYLON.Scene;
	private depth: number;
	private name: string;
	private DEBUG: boolean;
    private maps: Array<PointMap>;

	constructor(scene: BABYLON.Scene, data: mapData, DEBUG: boolean = false)
    {
		this.scene = scene;
		this.depth = 1;
		this.name = "ground";
		this.DEBUG = DEBUG;
        this.maps = new Array<PointMap>();

        data.points.forEach((map: Array<pointData>) => {
            if (map.length < 1) 
                return ;
            const newMap = createPointMap(Ground.mapDataToVector3(map), this.scene);
            this.maps.push(newMap);
        });
	}

    /**
	 * @brief Register an explosion and recalculate array and mesh
	 * @param explosionX number x coordinate of explosion center
	 * @param explosionY number y coordinate of explosion center
	 * @param radius number radius of the explosion
	 */
	affectTerrain(explosionX: number, explosionY: number, radius: number) {
        const newMaps = new Array<PointMap>();
        const explosionPoint = new BABYLON.Vector2(explosionX, explosionY);

        // For all maps stored in
        this.maps.forEach((map) => {
            const array = map.points;
            const len = array.length;
            let startIndex = -1;
            
            // Find point that is outside the explosion to keep walking through array
            for (let i = 0; i < len; i++) {
                if (!Ground.isPointInCircle(array[i].x, array[i].z, explosionPoint, radius)) {
                    startIndex = i;
                    break ;
                }
            }
            
            // If Explosion consumes entire mesh
            if (startIndex == -1) {
                map.physics.dispose();
                map.mesh.dispose();
                return ;
            }
            let insideExplosion = false;
            const newVectors = Array<BABYLON.Vector3>();
            const intersectionPoints: Array<IntersectionPoints> = [];
            console.log("Start", [...intersectionPoints]);

            let lastEntry = {
                x: 0,
                y: 0,
            };

            // Go through all Vectors that make up the map
            for (let i = 0; i < len; i++) {
                const currentIndex = (startIndex + i) % len;
                const nextIndex = (startIndex + i + 1) % len;

                const point1 = new BABYLON.Vector2(array[currentIndex].x, array[currentIndex].z);
                const point2 = new BABYLON.Vector2(array[nextIndex].x, array[nextIndex].z);
                const intersectArray = Ground.checkIntersection(point1, point2, explosionPoint, radius, 0.00001);
                console.log("Step", [...intersectionPoints]);

                if (!insideExplosion) {
	    			newVectors.push(new BABYLON.Vector3(point1.x, 0, point1.y));
                    if (intersectArray.length == 1) {
                        console.log("Entering");
                        // Only Entering Explosion
                        insideExplosion = true;
                        lastEntry = {
                            x: intersectArray[0].x,
                            y: intersectArray[0].y,
                        };
                        console.log("After1: ", [...intersectionPoints]);
                    }
                    else if (intersectArray.length === 2) {
                        // Entering and Exiting Explosion
                        intersectionPoints.push({
                            entry: {
                                x: intersectArray[0].x,
                                y: intersectArray[0].y,
                            },
                            exit: {
                                x: intersectArray[1].x,
                                y: intersectArray[1].y,
                            },
                            insertIndex: i
                        });
                    }
                }
                else if (intersectArray.length == 1) {
                    console.log("Exiting");
                    insideExplosion = false;
                    intersectionPoints.push({
                        entry: {
                            x: lastEntry.x,
                            y: lastEntry.y,
                        },
                        exit: {
                            x: intersectArray[0].x,
                            y: intersectArray[0].y,
                        },
                        insertIndex: i
                    });
                    console.log("After2: ", [...intersectionPoints]);
                }
                // Exiting & Entering in 1 line is impossible
            }
            // If this Map was affected, make new mesh
            // otherwise just store old one
            console.log("In the end:", intersectionPoints);
            const resultingMaps: Array<PointMap> = this.handleIntersections(newVectors, intersectionPoints, map, explosionPoint, radius);
            resultingMaps.forEach((resultingMap) => {
                newMaps.push(resultingMap);
            })
        });
        this.maps = newMaps;
	}

    // Turns data for 1 map into vector3 representation
    private static mapDataToVector3(data: Array<pointData>) {
        const result = new Array<BABYLON.Vector3>();
        // For each point in a map
        data.forEach((point: pointData) => {
            result.push(new BABYLON.Vector3(point.x, 0, point.y));
        });
        return (result);
    }

    /**
     * raw angle formula derived from https://wumbo.net/formulas/angle-between-two-vectors-2d/
     * Uses vector(0, 1) to compare against
     * @param Vector
     * @returns Angle in radians, 0 meaning straight up, increasing angle turns counter clockwise
    */
    private static angle(target: BABYLON.Vector2) {
        const raw_angle = Math.atan2(target.x, target.y);
        const adjusted_angle = ((Math.PI * 2) - raw_angle) % (Math.PI * 2);
        console.log(`Returninig angle ${adjusted_angle / Math.PI * 180} for ${(Math.PI * 2) - raw_angle} % ${(Math.PI * 2)}`);
        return (adjusted_angle);
    }

    /**
    * @brief Fills newArray with points along curved surface
    * @param newArray Array of BABYLON.Vector3 that represents the new map, last entry should be the point where the explosion begins
    * @param explostionPoint Vector to where explosion is
    * @param exitPoint Vector with coordinates, where line exits explosion
    * @param radius number for radius of explosion
    */
    // UNUSED for now
    private static onExitingExplo(newArray: Array<BABYLON.Vector3>, explosionPoint: BABYLON.Vector2, exitPoint: BABYLON.Vector2, radius: number) {
        // Prepare vectors for crossproduct
        const entryPoint = new BABYLON.Vector2(newArray[newArray.length - 1].x, newArray[newArray.length - 1].z);
        const exploToEntry = entryPoint.subtract(explosionPoint);
        const exploToExit = exitPoint.subtract(explosionPoint);
        console.log("Entry: ", entryPoint, "Exit: ", exitPoint);

        // Get angles of entrance and middle point
        const tessalationCount = 20;
        const startAngle = Ground.angle(exploToEntry);
        const endAngle = Ground.angle(exploToExit);
        let angleDiff = endAngle - startAngle;
        if (angleDiff > 0)
            angleDiff -= Math.PI * 2;

        // Divide the shortest path by the steps
        const angleEachStep = angleDiff  / (tessalationCount);
        console.log("StartAngle: ", startAngle / Math.PI * 180, "EndAngle: ", endAngle / Math.PI * 180, "AngleEachStep: ", angleEachStep / Math.PI * 180);

        // Walk along explosions surface, putting tesselationCount points into the newArray
        for (let i = 1; i < tessalationCount; i++) {
            newArray.push(new BABYLON.Vector3(
                -Math.sin(startAngle + angleEachStep * i) * radius + explosionPoint.x,
                0, 
                Math.cos(startAngle + angleEachStep * i) * radius + explosionPoint.y
            ));
        }
        newArray.push(new BABYLON.Vector3(exitPoint.x, 0, exitPoint.y));
    }

    /**
     * @brief Quickly check, if the given point is inside the Explosion
     * @param firstX number for x coordinate of point
     * @param firstY number for y coordinate of point
     * @param explosionPoint Vector representing center point of explosion
     * @param radius number for radius of explosion
     * @returns true if point is inside explosion, false otherwise
     */
    private static isPointInCircle(firstX: number, firstY: number, explosionPoint: BABYLON.Vector2, radius: number) {
        const point1 = new BABYLON.Vector2(firstX, firstY);
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
    private static checkIntersection(point1: BABYLON.Vector2, point2: BABYLON.Vector2, exploPoint: BABYLON.Vector2, radius: number, tolerance: number) {
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


    /**
     * Handles the intersections for 1 map
     * May split the map into multiple ones,
     * May consume entire map
     * If no intersections, just return old map
     * @returns the resulting maps of the intersection calculations
     */
    private handleIntersections(
        vectors: Array<BABYLON.Vector3>, 
        intersections: Array<IntersectionPoints>,
        old: PointMap,
        explosionPoint: BABYLON.Vector2,
        radius
    ): Array<PointMap> {
        const result = new Array<PointMap>();

        // If no Intersections happened, simply return old map data
        if (intersections.length == 0)
            return ([old]);

        // For each intersection that happened
        intersections.forEach((intersection) => {
            


            // Prepare vectors for crossproduct
            const entryPoint = new BABYLON.Vector2(intersection.entry.x, intersection.entry.y);
            const exitPoint = new BABYLON.Vector2(intersection.exit.x, intersection.exit.y);
            const exploToEntry = entryPoint.subtract(explosionPoint);
            const exploToExit = exitPoint.subtract(explosionPoint);
            console.log("Entry: ", entryPoint, "Exit: ", exitPoint);

            // Get angles of entrance and middle point
            const tessalationCount = 20;
            const startAngle = Ground.angle(exploToEntry);
            const endAngle = Ground.angle(exploToExit);
            let angleDiff = endAngle - startAngle;
            if (angleDiff > 0)
                angleDiff -= Math.PI * 2;

            // Divide the start->end path by the steps
            const angleEachStep = angleDiff  / (tessalationCount);
            console.log("StartAngle: ", startAngle / Math.PI * 180, "EndAngle: ", endAngle / Math.PI * 180, "AngleEachStep: ", angleEachStep / Math.PI * 180);

            // Walk along explosions surface, putting tesselationCount points into the newArray
            const newVectors = vectors.slice(0, intersection.insertIndex);
            for (let i = 1; i < tessalationCount; i++) {
                newVectors.push(new BABYLON.Vector3(
                    -Math.sin(startAngle + angleEachStep * i) * radius + explosionPoint.x,
                    0, 
                    Math.cos(startAngle + angleEachStep * i) * radius + explosionPoint.y
                ));
            }
            vectors.slice(intersection.insertIndex).forEach((vec) => {
                newVectors.push(vec);
            })
            vectors = newVectors;
            console.log(`Intersection at  ${intersection.entry}, ${intersection.exit}, index: ${intersection.insertIndex}`);
        })
        result.push(createPointMap(vectors, this.scene));
        /*
        const newMap = {
            points: map.points,
            mesh: map.mesh,
            physics: map.physics,
        };
        */
        return (result);
    }

    dispose() {
        this.maps.forEach((map: PointMap) => {
            map.physics.dispose();
            map.mesh.dispose();
        })
    }
}


const map = { points: [[
	{x: 0,   y: 0 ,},
	{x: 0,   y: 5 ,},
	{x: -3,  y: 5 ,},
	{x: -3,  y: 11,},
	{x: 0,   y: 11,},
	{x: 0,   y: 16,},
	{x: -7,  y: 16,},
	{x: -7,  y: 11,},
	{x: -4,  y: 11,},
	{x: -4,  y: 5 ,},
	{x: -7,   y: 5 ,},
	{x: -7,   y: 0 ,},
	{x: -4,   y: 0 ,},
	{x: -4,   y: 1 ,},
	{x: -6,   y: 1 ,},
	{x: -6,   y: 2 ,},
	{x: -1,   y: 2 ,},
	{x: -1,   y: 1 ,},
	{x: -3,   y: 1 ,},
	{x: -3,   y: 0 ,},
]]};

function addPositionCutting(scene: BABYLON.Scene, ground: Ground) {
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyUpTrigger,
            parameter: "1",
        },
        () => {
            ground.affectTerrain(-3.5, -.1, 2);
        }
    ))
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyUpTrigger,
            parameter: "2",
        },
        () => {
            ground.affectTerrain(-3.5, 16, 2);
        }
    ))
}


class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);
        scene.actionManager = new BABYLON.ActionManager();

        // Add Havoc Phys Engine and Gravity to scene
        const hk = new BABYLON.HavokPlugin();
        scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);

        // This creates and positions a free camera (non-mesh)
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(-3.5, 6, -40), scene);

        // This targets the camera to scene origin
        camera.setTarget(new BABYLON.Vector3(-3.5, 6, 0));

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'ground' shape.
        const ground = new Ground(scene, map, true)

        addPositionCutting(scene, ground);

        return scene;
    }
}
export { Playground };