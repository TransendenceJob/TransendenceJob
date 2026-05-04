import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from './spawnPlayers';
import { generateTurnOrder } from './generateTurnOrder';

export const PLAYER_COUNT = 4;
export const WORMS_PER_PLAYER = 4;

export function generateGameData() {
  const data: gameData = {
    players: [],
    turnOrder: [],
  };
  spawnPlayers(data);
  generateTurnOrder(data);
  return data;
}
