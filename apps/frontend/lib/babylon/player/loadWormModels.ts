import { wormData } from "@/shared/packets/util";
import { AbstractMesh, ImportMeshAsync, Mesh, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";

export interface wormModelData {
	collider: AbstractMesh;
	model: AbstractMesh;
}

/**
 * This needs to be called, after the turns have been set up
 * Sets up the Action for setting the chosen worm, when the player clicks on the mesh
 * @param setterFunction function that sets the chosen worm to the given parameter
 */
async function loadModel(path: string, scene: Scene, meshIndex: number) : Promise<AbstractMesh>{
    return ((await ImportMeshAsync(path, scene)).meshes[meshIndex]);
}

export async function loadWormModels(scene: Scene): Promise<wormModelData> {
    const collider = await loadModel("/assets/Diamond3.glb", scene, 1);
    const model = await loadModel("https://assets.babylonjs.com/meshes/HVGirl.glb", scene, 0);
    
    // Parent of this mesh inverts its x axis, so remove it :)
    collider.setParent(null);
    return ({
        collider: collider,
        model: model,
    })
}