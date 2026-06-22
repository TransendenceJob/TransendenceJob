import { gameData, mapData, pointData } from '@/shared/packets/util';
import { map1 } from './maps/map1';
import { map2 } from './maps/map2';

export function generateMapData(data: gameData, mapName: string) {
  if (mapName == "map2") {
    data.map = {
      points: new Array<pointData>(),
    };
    map2.forEach((point) => {
      data.map.points.push({ x: point[0], y: point[1] });
    });
    return ;
  }
  data.map = {
    points: new Array<pointData>(),
  };
  map1.forEach((point) => {
    data.map.points.push({ x: point[0], y: point[1] });
  });

  // data.map[1] = {
  //   points: new Array<pointData>(),
  // };
  // map2.forEach((point) => {
  //   data.map[1].points.push({ x: point[0], y: point[1] });
  // });
}
