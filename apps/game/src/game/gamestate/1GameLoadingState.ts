import { IState } from './IState';
import { Game } from '../Game';
import { SC_Type } from '@/shared/packets/ServerClientPackets';
import { generateGameData } from '../spawning/generateGameData';

export class GameLoadingState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Game pending');

    // Tells Clients to start Loading
    this.game.sendState();

    // Sends Information for each player to load the game
    const data = generateGameData(this.game.lobby.clients);
    this.game.sendPacket(SC_Type.SC_GameData, {
      data,
    });
    // Clients are sorted by their turn oder
    if (this.game.lobby.clients.length <= 0) return;
    this.game.lobby.clients.sort(
      (a, b) =>
        // find client a's slot numbers position in the turnorder
        data.turnOrder.findIndex((position) => position == a.slot) -
        // find client b's slot numbers position in the turnorder
        data.turnOrder.findIndex((position) => position == b.slot),
    );
    // Set last player as active, so first player starts, when on Turn Start we move to next player
    this.game.activeClient =
      this.game.lobby.clients[this.game.lobby.clients.length - 1];
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
