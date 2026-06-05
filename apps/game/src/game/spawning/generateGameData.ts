import { gameData } from '@/shared/packets/util';
import { spawnPlayers } from './spawnPlayers';
import { generateMapData } from './generateMapData';
import { Client } from '@/shared/packets/Client';

export const PLAYER_COUNT = 4;
export const WORMS_PER_PLAYER = 4;

// Shuffles an existing array
// Credit: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array: Array<any>) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export function generateGameData(clients: Array<Client>) {
  // Generate random turn order, by shuffling clients around
  shuffle(clients);
  const data: gameData = {
    players: [],
    map: {
      points: [],
    },
  };
  spawnPlayers(data, clients);
  generateMapData(data);
  return data;
}
