// @ts-ignore
import { Scene, Vector3, Scalar, Color3 } from '@babylonjs/core';

import { Worm } from './Worm';
import { Player } from '../Player';
import { generateSpawnAreas } from '../data/vectorData';

function generatePosition(spawnAreas: Vector3[][]): Vector3 | undefined {
    // Check if no valid positions left for spawning
    let position: Vector3 | undefined = undefined;
    let working: true;

    // Choose random spawning area
    while (spawnAreas.length > 0) {
        const num = Math.floor(Scalar.RandomRange(0, spawnAreas.length));
        // If area is empty, take it out of array
        if (spawnAreas[num].length <= 0) { 
            spawnAreas.splice(num, 1);
            continue ;
        }
        // Generate position in area
        let pos = Math.floor(Scalar.RandomRange(0, spawnAreas[num].length));
        position = spawnAreas[num][pos];
        // Remove position from subarea, and subarea f rom areas if neccesary

        spawnAreas[num].splice(pos, 1);
        if (spawnAreas[num].length <= 0)
            spawnAreas.splice(num, 1);
        break ;
    }
    return (position);
}

export function spawnWorms(scene: Scene, players: Array<Player>, colors: Color3[])
{
	const SPAWN_AMOUNT = 5;
    const spawnAreas = generateSpawnAreas();
    console.log(`Spawn areas ${spawnAreas.length} ${spawnAreas}`);

	let wormId = 0;
    // For each player
    for (let p = 0; p < players.length; p++)
    {
        let i = 0;
        // Spawn 5 worms per player
        while (i < SPAWN_AMOUNT)
        {
            // Generate point and return if that failed
            const point: Vector3 | undefined = generatePosition(spawnAreas);
            if (!point)
                return (false);
            console.log(`For player ${p}s ${i}th worm generated ${point} for color ${colors[p]}`);
            players[p].addWorm(new Worm(scene, point, wormId, colors[p]))
            wormId++;
            i++;
        }
    }
	return (true);
}