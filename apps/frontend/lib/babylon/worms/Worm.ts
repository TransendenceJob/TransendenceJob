// @ts-ignore
import { Mesh, Scene, Vector3, Color3, Scalar, MeshBuilder, StandardMaterial } from "@babylonjs/core";

/**
 * Function to create the mesh of a worm
 * @param scene Scene to track mesh
 * @param position Initial position for worm
 * @param color Color for material of worm
 */
function createWorm(scene: Scene, position: Vector3, color: Color3) {
	const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
	sphere.position = position;

	var material = new StandardMaterial("material", scene);
	material.emissiveColor = color;

	sphere.material = material;
    return (sphere);
}

/**
 * Class that represents 1 Worm
 * @note Ownership of a Worm should be handled by a Player class
 * @param mesh 3d mesh of the specific worm
 * @param id Unique identifier by which to identify worm
 * @param name string for the worms display name
 * @function dispose Used to clean up mesh
 */
export class Worm {
	public mesh: Mesh;
	public id: number;
	public name: string;
    /**
     * 
     * @param scene Scene that tracks worm mesh
     * @param pos Initial position for worm
     * @param id Unique identifier for worm
     * @param color Color for the worms mesh texture
     * @param name Display name of the worm
     */
	constructor(scene: Scene, pos: Vector3, id: number, color: Color3, name: string = "Unnamed worm") {
		this.mesh = createWorm(scene, pos, color);
        this.id = id;
        this.name = name;
	}

    /**
     * @warning Calling this wont delete the worm, so any call to dispose() 
     * should be followed by deletion or untracking of the Worm object
     */
    dispose() {
        if (this.mesh)
            this.mesh.dispose();
    }
}



export function moveWorm()
{
    
}