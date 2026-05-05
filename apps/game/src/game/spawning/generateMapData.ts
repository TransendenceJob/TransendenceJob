import { gameData, mapData, pointData } from '@/shared/packets/util';
import { map1 } from './maps/map1';

export function generateMapData(data: gameData) {
  data.map = {
    points: new Array<pointData>(),
  };
  map1.forEach((point) => {
    data.map.points.push({ x: point[0], y: point[1] });
  });
}
