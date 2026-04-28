import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class TurnStartState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Turn starts');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {
    this.game.setState(GameState.PICK_WORM);
  }

  exit() {
    this.reset();
  }

  reset(): void {}
}
