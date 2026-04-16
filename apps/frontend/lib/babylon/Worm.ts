// @ts-ignore
import { Scene, Vector3, Color3, Scalar, MeshBuilder, StandardMaterial } from "@babylonjs/core";

export function spawnWorms(scene: Scene, spawnAreas: Vector3[][], numPlayers: number, colors: Color3[])
{
    for (let p = 0; p < numPlayers; p++)
    {
        let i = 0;
        while (i < 5)
        {
            let num = Math.floor(Scalar.RandomRange(0, 10));
            while (!spawnAreas[num])
                num = Math.floor(Scalar.RandomRange(0, 10));
            
            let spawn_num = Math.floor(Scalar.RandomRange(1, 2));
            for (let j = spawn_num; j > 0; j--)
            {
                let pos = Math.floor(Scalar.RandomRange(0, (spawnAreas[num].length)));
                while (!spawnAreas[num][pos])
                    pos = Math.floor(Scalar.RandomRange(0, (spawnAreas[num].length)));

                const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
                sphere.position = spawnAreas[num][pos];

                var material = new StandardMaterial("material", scene);
                material.emissiveColor = colors[p];

                sphere.material = material;

                spawnAreas[num].splice(pos, 1);
            }
            spawnAreas.splice(num, 1);
            i = i + spawn_num;
        }
    }
}

export function moveWorm()
{
    
}