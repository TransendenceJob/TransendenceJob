import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class GamePendingState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Game pending');

    // Tell Clients to move to next state
    // This is somewhat of a special case, that should not be sent
    this.game.sendState();
    this.game
  }

  tick() {
    // Automatically jump to start of game
    this.game.setState(GameState.GAME_START);
  }

  exit() {
    this.reset();
  }

  reset(): void {}
}
