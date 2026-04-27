// @ts-ignore
import { Mesh, Scene, Vector3, Color3, Scalar, MeshBuilder, StandardMaterial, ActionManager, ExecuteCodeAction } from "@babylonjs/core";

/**
 * Function to create the mesh of a worm
 * @param scene Scene to track mesh
 * @param position Initial position for worm
 * @param color Color for material of worm
 */
function createWorm(scene: Scene, position: Vector3, color: Color3) {
	const player = MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
	player.position = position;

	var material = new StandardMaterial("material", scene);
	material.emissiveColor = color;

	player.material = material;
    return (player);
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
    private initialised: boolean = false;
	public mesh: Mesh;
	public id: number;
	public name: string;
    private action: ActionManager | undefined = undefined;
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
        this.mesh.actionManager = new ActionManager(scene);
        this.id = id;
        this.name = name;
	}
    
    /**
     * This needs to be called, after the turns have been set up
     * Sets up the Action for setting the chosen worm, when the player clicks on the mesh
     * @param setterFunction function that sets the chosen worm to the given parameter
     */
    initClickable(setterFunction: (chosen: Worm) => void) {
        if (this.initialised)
            return ;
        this.initialised = true;
        this.action = new ExecuteCodeAction(ActionManager.OnPickUpTrigger, () => {
            setterFunction(this);
        })
    }

    /**
     * Tells the Worm to activate the functionality for being able to pick a worm
     */
    makeClickable() {
        if (this.action && this.mesh.actionManager)
            this.mesh.actionManager.registerAction(this.action);
    }

    removeClickable() {
        if (this.action && this.mesh.actionManager)
            this.mesh.actionManager.unregisterAction(this.action);
        console.log("Calling makeClickable");
    }

    /**
     * @warning Calling this wont delete the worm, so any call to dispose() 
     * should be followed by deletion or untracking of the Worm object
     */
    dispose() {
        this.initialised = false;
        this.removeClickable();
        if (this.mesh) {
            this.mesh.actionManager.dispose();
            this.mesh.dispose();
        }
    }
}



export function moveWorm()
{
    
}