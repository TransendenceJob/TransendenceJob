import { wormData } from '@/shared/packets/util';
import {
  Scene,
  Vector3,
  MeshBuilder,
  AbstractMesh,
  Mesh,
} from '@babylonjs/core';

export interface wormModelData {
  collider: AbstractMesh;
  model: AbstractMesh;
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
  public health: number;

  // Movement
  public playerSpeed: number;

  // ID
  public id: number;
  public name: string;

  // Model
  public mesh: Mesh;

  // Checks
  public onGround: boolean;
  public canJump: boolean;
  public isMoving: number;
  public jumpTimer: number;
  public dirX: number;
  public pos: Vector3;
  public previousPos: Vector3;

  /**
   *
   * @param scene Scene that tracks worm mesh
   * @param pos Initial position for worm
   * @param id Unique identifier for worm
   * @param color Color for the worms mesh texture
   * @param name Display name of the worm
   */
  constructor(scene: Scene, data: wormData, maxHealth: number) {
    this.mesh = MeshBuilder.CreateBox(`Worm ${data.id}`, {}, scene);

    // ID
    this.id = data.id;
    this.name = `Unnamed worm ${this.id}`;
    this.health = maxHealth;

    // Movement
    this.playerSpeed = 2;

    // Checks
    this.onGround = false;
    this.canJump = true;
    this.isMoving = 0;
    this.jumpTimer = 0;
    this.dirX = 0;

    // Model
    this.mesh.position = new Vector3(data.pos.x, data.pos.y + 0.2, 0);

    this.pos = this.mesh.position.clone();
    this.previousPos = this.mesh.position.clone();
  }

  /**
   * @warning Calling this wont delete the worm, so any call to dispose()
   * should be followed by deletion or untracking of the Worm object
   */
  dispose() {
    this.mesh.dispose();
  }
}
