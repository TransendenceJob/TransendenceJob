// @ts-ignore
import { Scene, Vector3, Scalar, Color3 } from '@babylonjs/core';

import { Worm } from './Worm';
import { Player } from '../Player';

export function spawnWorms(scene: Scene, spawnAreas: Vector3[][], players: Array<Player>, colors: Color3[])
{
	const SPAWN_AMOUNT = 5;

	let wormId = 0;
    // For each player
    for (let p = 0; p < players.length; p++)
    {
        let i = 0;
        // Spawn 5 worms per player
        while (i < SPAWN_AMOUNT)
        {
            // Check if no valid positions left for spawning
            if (spawnAreas.length <= 0) {
                console.warn("Error: Ran out of spawn Areas for worms!");
                return (false);
            }
            // Choose random spawning area
            let attempts = 0;
            let num = Math.floor(Scalar.RandomRange(0, spawnAreas.length));
            while (spawnAreas[num].length === 0) {
                spawnAreas.splice(num, 1); // remove exhausted area immediately
                if (spawnAreas.length === 0) {
                    console.warn("Error: All spawn areas exhausted!");
                    return false;
                }
                num = Math.floor(Scalar.RandomRange(0, spawnAreas.length));
            }

            // Spawn either 1 or 2 worms in the chosen area
            // let spawn_num = Math.min(i, Math.floor(Scalar.RandomRange(1, 2)));
            let spawn_num = Math.floor(Scalar.RandomRange(1, 2));
            for (let j = spawn_num; j > 0; j--){
                if (spawnAreas[num].length === 0) break;

            {
                // Choose random position from area
                let pos = Math.floor(Scalar.RandomRange(0, (spawnAreas[num].length)));
                while (!spawnAreas[num][pos])
                    pos = Math.floor(Scalar.RandomRange(0, (spawnAreas[num].length)));
                // Actually spawn worm in there
				players[p].addWorm(new Worm(scene, spawnAreas[num][pos], wormId, colors[p]))
                wormId++;
                spawnAreas[num].splice(pos, 1);
            }
            spawnAreas.splice(num, 1);
            i = i + spawn_num;
        }
    }
	return (true);
}