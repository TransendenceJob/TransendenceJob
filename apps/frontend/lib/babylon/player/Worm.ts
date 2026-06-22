import { Mesh, Scene, Vector3, Color3, MeshBuilder, StandardMaterial, ActionManager, ExecuteCodeAction, AbstractMesh, Nullable, AnimationGroup, PhysicsRaycastResult, PhysicsAggregate, ImportMeshAsync, Quaternion, PhysicsShape, PhysicsShapeType, PhysicsMotionType, PhysicsEngine, ISceneLoaderAsyncResult, HighlightLayer, Axis } from "@babylonjs/core";
import { wormData } from '@/shared/packets/util';
import { colors } from '../data/gameData';
import { wormModelData } from "./loadWormModels";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { triggerAsyncId } from "async_hooks";
import { WormGui } from "./WormGui";

/**
 * Function to create the mesh of a worm
 * @param scene Scene to track mesh
 * @param position Initial position for worm
 * @param color Color for material of worm
 */
function createWorm(scene: Scene, position: Vector3, color: Color3) {
	const player = MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
	player.position = position;

	const material = new StandardMaterial("material", scene);
	material.emissiveColor = color;

	player.material = material;
    return (player);
}

/**
 * Class that represents 1 Worm
 * @note Ownership of a Worm should be handled by a Player classmod
 * @param mesh 3d mesh of the specific worm
 * @param id Unique identifier by which to identify worm
 * @param name string for the worms display name
 * @function dispose Used to clean up mesh
 */
export class Worm {

    private initialised: boolean = false;
    private action: ExecuteCodeAction | undefined = undefined;
    private clickable: boolean;

    // GUI + Health
    public gui: WormGui;
    
    // Movement
    public playerSpeed: number;
    private secUntilNextJump: number;

    // Animations
    public idleAnim: Nullable<AnimationGroup>;
    public walkAnim: Nullable<AnimationGroup>;
    public airAnim: Nullable<AnimationGroup>;

    // ID
	public id: number;
	public name: string;

    // Checks
    public onGround: boolean;
    public canJump: boolean;
    public isMoving: number;
    public jumpTimer: number;
    public dirX: number;
    public pos: Vector3;
    public previousPos: Vector3;

    // Model
    public collider: AbstractMesh;
    public model: AbstractMesh;
    public aggregate: PhysicsAggregate;

    /**
     * 
     * @param scene Scene that tracks worm mesh
     * @param pos Initial position for worm
     * @param id Unique identifier for worm
     * @param color Color for the worms mesh texture
     * @param name Display name of the worm
     */
	constructor(
        scene: Scene, 
        data: wormData, 
        slot: number, 
        modelData: wormModelData,
        maxHealth: number,
        canvas: HTMLCanvasElement,
    ) {
        // this.mesh = createWorm(scene, new Vector3(data.pos.x, data.pos.y, 0), colors[slot]);
        // this.mesh.actionManager = new ActionManager(scene);
        
        // ID
        this.id = data.id;
        this.name = `Unnamed worm ${this.id}`;
        
        // Movement
        this.playerSpeed = 2;
        this.secUntilNextJump = 1.4;

        // Animations
        this.idleAnim = scene.getAnimationGroupByName("Idle")!;
        this.walkAnim = scene.getAnimationGroupByName("Walking")!;
        this.airAnim = scene.getAnimationGroupByName("Samba")!;

        // Checks
        this.clickable = false;
        this.onGround = false;
        this.canJump = true;
        this.isMoving = 0;
        this.jumpTimer = 0;
        this.dirX = 0;

        // Model
        const coll: Nullable<AbstractMesh> = modelData.collider.clone(`collider: ${this.id}`, null);
        if (!coll)
            throw ("Error: collider is Null");
        this.collider = coll;
        this.collider.position = new Vector3(data.pos.x, data.pos.y + 0.2, 0);
        this.collider.rotation = Vector3.Zero();
        this.collider.rotationQuaternion = Quaternion.Identity();
        this.collider.scaling.setAll(0.4);
        // Make invis
        this.collider.visibility = 0;

        const material = new StandardMaterial("material", scene);
	    material.emissiveColor = colors[slot];

        this.collider.material = material;

        const mod: Nullable<AbstractMesh> = modelData.model.clone(`model: ${this.id}`, null);
        if (!mod)
            throw ("Error: model is Null");
        this.model = mod;
        this.model.parent = this.collider;
        this.model.position.y = this.model.position.y - 3.2;
        this.model.scaling.setAll(0.2);
        this.aggregate = new PhysicsAggregate
        (
            this.collider,
            PhysicsShapeType.CONVEX_HULL,
            { mass: 1, friction: 0.3, restitution: 0 },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.collider.actionManager = new ActionManager(scene);
        if (!this.collider.actionManager)
            throw new Error("Worm Constructor: Collider could not create an Action Manager");

        this.pos = this.collider.position.clone();
        this.previousPos = this.collider.position.clone();

		this.aggregate.body.setGravityFactor(0);

        // Stats
        this.gui = new WormGui(scene, canvas, this.collider, maxHealth, colors[slot], this.name);
	}

    /**
     * Tells the Worm to activate the functionality for being able to pick a worm
     */
    makeClickable(pickWorm: (worm: Worm) => void) {
        if (this.clickable)
            return ;
        this.clickable = true;
        this.action = new ExecuteCodeAction({
            trigger: ActionManager.OnPickUpTrigger
        }, () => {
            pickWorm(this);
        })
        if (this.collider.actionManager) {
            this.collider.actionManager.registerAction(this.action);
        }
    }

    /**
     * Tells the Worm to deactivate the functionality for being able to pick a worm
     */
    removeClickable() {
        if (!this.clickable)
            return ;
        this.clickable = false;
        if (this.action && this.collider.actionManager) {
            this.collider.actionManager.unregisterAction(this.action);
            this.action = undefined;
        }
    }

    /**
     * @warning Calling this wont delete the worm, so any call to dispose() 
     * should be followed by deletion or untracking of the Worm object
     */
    dispose() {
        this.initialised = false;
        this.gui.dispose();
        this.removeClickable();
        if (this.model) {
            this.model.dispose();
        }
        this.collider.actionManager?.dispose();
        this.collider.dispose();
    }

    move(direction: number, rotation: number) {
        // Approving movement and applying fake gravity
        this.isMoving = 1;
        this.aggregate.body.applyImpulse(new Vector3(0, -14, 0), this.collider.getAbsolutePosition());

        // Starting movement animation
        if (!this.walkAnim?.isPlaying)
            this.walkAnim?.start(true, 1, this.walkAnim.from, this.walkAnim.to, false);

        // Changing worms rotation
        this.model.rotationQuaternion = Quaternion.RotationAxis(Axis.Y, rotation);
        this.dirX = direction;

        // Move worm
        // const currentVel = this.aggregate.body.getLinearVelocity();
        // this.aggregate.body.setLinearVelocity( new Vector3((this.dirX * this.playerSpeed) * this.isMoving, currentVel.y, 0));
    }

    jump(horiStrength: number, vertStrength: number, now: number){
        // Stopping walking animation and starting air animation
        this.walkAnim?.stop();
        this.jumpTimer = now + (1000 * this.secUntilNextJump);


        this.aggregate.body.applyImpulse
        (
            new Vector3
            (
                this.dirX * (horiStrength * 200),
                vertStrength * 200,
                0
            ),
            this.collider.getAbsolutePosition()
        );
    }

    stop(){
        this.isMoving = 0;
        this.walkAnim?.stop();
        if (!this.idleAnim?.isPlaying)
            this.idleAnim?.start(true, 1, this.idleAnim.from, this.idleAnim.to, false);

        // const currentVel = this.aggregate.body.getLinearVelocity();
        // this.aggregate.body.setLinearVelocity( new Vector3((this.dirX * this.playerSpeed) * this.isMoving, currentVel.y, 0));
    }
}
