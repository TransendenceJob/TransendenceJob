import { gameData, playerData, wormData } from '@/shared/packets/util';
import { Vector2, Scalar } from '@babylonjs/core';
import { generateSpawnAreas } from './vectorData';

class WormSpawner {
  private points: Array<Array<Vector2>>;
  private idCounter: number;
  constructor(points: Array<Array<Vector2>>) {
    this.points = points;
    this.idCounter = 0;
  }

  // Choose random spawning area
  generate(): wormData | undefined {
    let result: wormData | undefined = undefined;
    while (this.points.length > 0) {
      const num = Math.floor(Scalar.RandomRange(0, this.points.length));
      // If area is empty, take it out of array
      if (this.points[num].length <= 0) {
        this.points.splice(num, 1);
        continue;
      }
      // Generate position in area
      const pos = Math.floor(Scalar.RandomRange(0, this.points[num].length));
      result = {
        id: this.idCounter,
        pos: { x: this.points[num][pos].x, y: this.points[num][pos].y },
      };
      this.idCounter++;
      // Remove position from subarea, and subarea f rom areas if neccesary
      this.points[num].splice(pos, 1);
      if (this.points[num].length <= 0) this.points.splice(num, 1);
      break;
    }
    return result;
  }
}

export function spawnPlayers(data: gameData) {
  const spawner = new WormSpawner(generateSpawnAreas());
  const PLAYER_COUNT = 4;
  const WORMS_PER_PLAYER = 4;
  for (let i = 1; i < PLAYER_COUNT + 1; i++) {
    const new_player: playerData = {
      id: i,
      slot: i - 1,
      name: `Player ${i}`,
      worms: [],
    };
    for (let i = 0; i < WORMS_PER_PLAYER; i++) {
      const data = spawner.generate();
      if (!data) break;
      new_player.worms.push(data);
    }
    data.players.push(new_player);
  }
}
