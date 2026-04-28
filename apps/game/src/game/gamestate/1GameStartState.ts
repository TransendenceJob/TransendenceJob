import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class GameStartState implements IState {
  private timer: number = 0;
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Game starts');
    this.timer = Date.now();

    // Tell Clients to move to next state
    this.game.sendState();
  }

  tick() {
    // Add timer to match frontends loading in animation duration
    if (this.timer + 3000 <= Date.now())
      this.game.setState(GameState.ROUND_START);
  }

  exit() {
    this.reset();
  }

  reset(): void {
    this.timer = 0;
  }
}
