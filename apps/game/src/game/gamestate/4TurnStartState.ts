import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';

export class TurnStartState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Turn starts');

    // Choose next active player
    const clients = this.game.lobby.clients;
    const oldClientIndex = clients.findIndex(
      (client) => client.id == this.game.activeClient.id,
    );
    // 0 -> 1
    // 1 -> 2
    // 2 -> 0
    //
    this.game.activeClient = clients[(oldClientIndex + 1) % clients.length];
    console.log(`New Clients Turn: ${this.game.activeClient.name}`);

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
