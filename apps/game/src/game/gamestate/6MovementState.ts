import { IState } from './IState';
import { Game } from '../Game';

export class MovementState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Movement state begins');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
