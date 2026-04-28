import { IState } from './IState';
import { Game } from '../Game';

export class TurnEndState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('End of Turn state begins');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
