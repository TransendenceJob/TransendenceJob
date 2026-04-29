import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from './spawnPlayers';

export function generateGameData() {
  const data: gameData = {
    players: [],
  };
  spawnPlayers(data);
  return data;
}
