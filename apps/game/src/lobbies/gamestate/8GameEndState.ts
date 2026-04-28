import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class GameEndState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('End of Game state begins');

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {
    this.game.setState(GameState.GAME_PENDING);
  }

  exit() {
    this.reset();
  }

  reset(): void {}
}
