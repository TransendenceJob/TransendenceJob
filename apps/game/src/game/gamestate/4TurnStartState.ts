import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';
import { SC_ActivePlayerChanged, SC_Type } from '@/shared/packets/ServerClientPackets';

export class TurnStartState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Turn starts');

    // Choose next active player
    const client = this.game.lobby.clientManager.getNextClient();
    this.game.sendPacket<SC_ActivePlayerChanged>(SC_Type.SC_ActivePlayerChanged, {
      activeId: client.id,
    })
    console.log(`New Clients Turn: ${client.name}`);

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
