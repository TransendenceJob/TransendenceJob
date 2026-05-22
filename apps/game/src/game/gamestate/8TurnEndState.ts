import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

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
