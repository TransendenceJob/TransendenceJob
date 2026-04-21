import { NullEngine, Scene } from 'babylonjs';

import { GameState } from '@/shared/state/GameState';
import { SC_Base, SC_Type, SC_DEV_GameState } from '@/shared/packets/ServerClientPackets';
import { SeqHandler } from './SeqHandler';

export class Game {
  // Member properties
  state: GameState;
  engine: NullEngine;
  scene: Scene;
  private seqHandler: SeqHandler;
  private msgToClient: (string) => void;
  private createBasePacket: <T extends SC_Base & { type: SC_Type }>(type: T['type'], data: Omit<T, keyof SC_Base | 'type'>) => T

  // Connstructor
  constructor(
    engine: NullEngine, 
    scene: Scene, 
    seqHandler: SeqHandler,
    msgToClient: (string) => void,
    createBasePacket: <T extends SC_Base & { type: SC_Type }>(
      type: T['type'],
      data: Omit<T, keyof SC_Base | 'type'>,
    ) => T
  ) {
    this.engine = engine;
    this.scene = scene;
    this.seqHandler = seqHandler;
    this.msgToClient = msgToClient;
    this.state = GameState.GAME_PENDING;
    this.createBasePacket = createBasePacket;
  }

  // Setter
  setState(newState: number) {
    this.state = newState as GameState;
    if (this.state > GameState.GAME_END) this.state = GameState.GAME_START;
  }

  // Getter
  get() {
    return this.state;
  }

  sendState() {
    const response = this.createBasePacket<SC_DEV_GameState>(
      SC_Type.SC_DEV_GameState,
      {
        gameState: this.state,
        msg: `State was reached: ${this.state}`,
      },
    );
    this.msgToClient(JSON.stringify(response));
  }

  /**
   * Tries to tick at least 1 time
   * Will keep ticking as long as the state changes
   */
  tick() {
    if (this.state == GameState.GAME_PENDING) return;
    let first: boolean = true;
    let previousState: GameState = this.state;
    while (this.state != previousState || first) {
      first = false;
      previousState = this.state;
      switch (this.state) {
        case GameState.GAME_START: {
          this.tick_game_start();
          break;
        }
        case GameState.ROUND_START: {
          this.tick_round_start();
          break;
        }
        case GameState.TURN_START: {
          this.tick_turn_start();
          break;
        }
        case GameState.PICK_WORM: {
          this.tick_pick_worm();
          break;
        }
        case GameState.MOVEMENT: {
          this.tick_movement();
          break;
        }
        case GameState.AIMING: {
          this.tick_aiming();
          break;
        }
        case GameState.TURN_END: {
          this.tick_turn_end();
          break;
        }
        case GameState.GAME_END: {
          this.tick_game_end();
          break;
        }
        default: {
          console.warn(
            'Error: A game on the server has reached an invalid state',
          );
          break;
        }
      }
    }
  }

  tick_game_start() {
    console.log('Game starts');
    this.state++;
    this.sendState();    
  }

  tick_round_start() {
    console.log('Round starts');
    this.state++;
    this.sendState();
  }

  tick_turn_start() {
    console.log('Turn starts');
    this.state++;
    this.sendState();
  }

  tick_pick_worm() {}

  tick_movement() {}

  tick_aiming() {}

  tick_turn_end() {}

  tick_game_end() {
    this.state = GameState.GAME_START;
    this.sendState();
  }
}
