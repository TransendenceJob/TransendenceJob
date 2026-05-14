import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from './spawnPlayers';
import { generateTurnOrder } from './generateTurnOrder';
import { generateMapData } from './generateMapData';
import { Client } from '@/shared/packets/Client';

export const PLAYER_COUNT = 4;
export const WORMS_PER_PLAYER = 4;

export function generateGameData(clients: Array<Client>) {
  const data: gameData = {
    players: [],
    turnOrder: [],
    map: {
      points: [],
    },
  };
  spawnPlayers(data, clients);
  generateTurnOrder(data);
  generateMapData(data);
  return data;
}
