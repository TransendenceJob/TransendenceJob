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
    this.game.sendPacket(SC_Type.SC_GameData, { data: generateGameData() });
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
