import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from './spawnPlayers';
import { generateTurnOrder } from './generateTurnOrder';
import { generateMapData } from './generateMapData';

export const PLAYER_COUNT = 4;
export const WORMS_PER_PLAYER = 4;

export function generateGameData() {
  const data: gameData = {
    players: [],
    turnOrder: [],
    map: {
      points: [],
    },
  };
  spawnPlayers(data);
  generateTurnOrder(data);
  generateMapData(data);
  return data;
}
