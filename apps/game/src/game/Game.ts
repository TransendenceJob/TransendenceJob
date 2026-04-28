import { NullEngine, Scene, ArcRotateCamera, Vector3 } from 'babylonjs';

// Shit happens cause the shared folder is outside of root directory
import { GameState } from '@/shared/state/GameState';
import { IState } from './gamestate/IState';
import { GamePendingState } from './gamestate/0GamePendingState';
import { GameStartState } from './gamestate/1GameStartState';
import { RoundStartState } from './gamestate/2RoundStartState';
import { TurnStartState } from './gamestate/3TurnStartState';
import { PickWormState } from './gamestate/4PickWormState';
import { MovementState } from './gamestate/5MovementState';
import { AimingState } from './gamestate/6AimingState';
import { TurnEndState } from './gamestate/7TurnEndState';
import { GameEndState } from './gamestate/8GameEndState';
import { SC_Base, SC_Type } from '@/shared/packets/ServerClientPackets';
import { msgToClientType } from '../lobbies/msgToClientType';

export class Game {
  // Member properties
  private engine: NullEngine;
  public scene: Scene;
  private camera: ArcRotateCamera;
  public sendState: () => void;
  public state: GameState;
  private stateMap: Map<GameState, IState>;
  private currentState: IState;

  // Connstructor
  constructor(
    engine: NullEngine,
    sendStatePacket: () => void,
    sendPacket: msgToClientType,
  ) {
    this.engine = engine;
    this.scene = new Scene(this.engine);
    this.camera = new ArcRotateCamera(
      'Camera',
      0,
      0.8,
      100,
      Vector3.Zero(),
      this.scene,
    );
    this.sendState = sendStatePacket;
    this.state = GameState.GAME_PENDING;
    this.stateMap = new Map();
    this.stateMap.set(GameState.GAME_PENDING, new GamePendingState(this));
    this.stateMap.set(GameState.GAME_START, new GameStartState(this));
    this.stateMap.set(GameState.ROUND_START, new RoundStartState(this));
    this.stateMap.set(GameState.TURN_START, new TurnStartState(this));
    this.stateMap.set(GameState.PICK_WORM, new PickWormState(this));
    this.stateMap.set(GameState.MOVEMENT, new MovementState(this));
    this.stateMap.set(GameState.AIMING, new AimingState(this));
    this.stateMap.set(GameState.TURN_END, new TurnEndState(this));
    this.stateMap.set(GameState.GAME_END, new GameEndState(this));
    this.currentState = new GamePendingState(this);
    this.currentState.enter();
  }

  // Setter
  setState(newState: GameState) {
    // Get class object and its functions from Map with GameState Enum and object
    // Call init of that one
    this.currentState.exit();
    this.state = newState;
    const newStateObj = this.stateMap.get(newState);
    this.currentState = newStateObj ? newStateObj : new GamePendingState(this);
    this.currentState.enter();
  }

  // Getter
  get() {
    return this.state;
  }

  /**
   * Tries to tick at least 1 time
   * Will keep ticking as long as the state changes
   */
  tick() {
    let first: boolean = true;
    let previousState: GameState = this.state;
    while (this.state != previousState || first) {
      first = false;
      previousState = this.state;
      this.currentState.tick();
    }
  }

  dispose() {
    this.camera.dispose();
    this.scene.dispose();
  }
}
