import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';
import {
  SC_ExplosionOccurs,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';
import { pointData } from '@/shared/packets/util';

export class TurnEndState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('End of Turn state begins');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {
    this.game.setState(GameState.TURN_START);
  }

  exit() {
    this.reset();
  }

  reset(): void {}
}
