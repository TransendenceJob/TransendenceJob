import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class GamePendingState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Game pending');

    // Transitionary state only, since we only create the Game, when the Lobby starts loading
  }

  tick() {
    this.game.setState(GameState.GAME_LOADING);
  }

  exit() {
    this.reset();
  }

  reset(): void {}
}
