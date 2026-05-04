import { gameData } from '@/shared/packets/util';

// Shuffles an existing array
// Credit: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array: Array<number>) {
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

/**
 * Generates and assigns order in which players start their turn, based on their slot number
 * @param data GameData to set, and get player info from
 */
export function generateTurnOrder(data: gameData) {
  const choices: Array<number> = [];
  data.players.forEach((player) => {
    choices.push(player.slot as number);
  });
  shuffle(choices);
  data.turnOrder = choices;
}
