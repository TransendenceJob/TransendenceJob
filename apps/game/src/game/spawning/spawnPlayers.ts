import { gameData, playerData } from '@/shared/packets/util';
import { Vector2, Scalar } from '@babylonjs/core';
import { generateSpawnAreas } from './vectorData';

class WormSpawner {
  private points: Array<Array<Vector2>>;
  constructor(points: Array<Array<Vector2>>) {
    this.points = points;
  }

  // Choose random spawning area
  generate(): Vector2 | undefined {
    let result: Vector2 | undefined = undefined;
    while (this.points.length > 0) {
      const num = Math.floor(Scalar.RandomRange(0, this.points.length));
      // If area is empty, take it out of array
      if (this.points[num].length <= 0) {
        this.points.splice(num, 1);
        continue;
      }
      // Generate position in area
      const pos = Math.floor(Scalar.RandomRange(0, this.points[num].length));
      result = this.points[num][pos];
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
      name: `Player ${i}`,
      worms: [],
    };
    for (let i = 0; i < WORMS_PER_PLAYER; i++) {
      const position = spawner.generate();
      if (!position) break;
      new_player.worms.push({ pos_x: position.x, pos_y: position.y });
    }
    (data.players as playerData[]).push(new_player);
  }
}
