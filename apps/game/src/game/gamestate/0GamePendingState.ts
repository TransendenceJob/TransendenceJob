import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';
import { SC_Type, SC_GameData } from '@/shared/packets/ServerClientPackets';
import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from '../spawning/spawnPlayers';
import { generateGameData } from '../spawning/generateGameData';

export class GamePendingState implements IState {
  constructor(private game: Game) {}

  enter() {
    this.reset();

    // Setup
    console.log('Game pending');

    // Tell Clients to move to next state
    // This is somewhat of a special case, that should not be sent
    this.game.sendState();
    this.game.sendPacket(SC_Type.SC_GameData, generateGameData());
  }

  tick() {}

  exit() {
    this.reset();
  }

  reset(): void {}
}
