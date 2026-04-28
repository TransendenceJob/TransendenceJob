import { IState } from './IState';
import { Game } from '../Game';

export class PickWormState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Picking worm');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
