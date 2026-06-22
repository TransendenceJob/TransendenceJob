import { Color4, GPUParticleSystem, MeshBuilder, Scene, Texture, Vector3 } from "@babylonjs/core";


// Abandoned idea for a particle system for explosions
export class ExplosionParticles {
    private system: GPUParticleSystem;
    private emitter;

    constructor(scene: Scene) {
        this.system = new GPUParticleSystem(
            "particles",
            { capacity: 4000 },
            scene
        );

        this.emitter = MeshBuilder.CreateSphere(
            "sphereEmitter",
            { diameter: 0.0001 },
            scene
        );

        this.system.emitter = this.emitter;

        this.system.particleTexture =
            new Texture("textures/sun.png", scene);

        this.system.minLifeTime = 0.5;
        this.system.maxLifeTime = 1;

        this.system.addColorGradient(
            0,
            new Color4(1, 1, 0.12, 1)
        );

        this.system.addColorGradient(
            1,
            new Color4(1, 0, 0, 0)
        );
    }

    start(pos: Vector3, size: number = 1) {
        const scale = 0.6 * Math.sqrt(size);

        this.system.minEmitPower = 10 * scale;
        this.system.maxEmitPower = 8 * scale;

        this.emitter.position.copyFrom(pos);

        this.system.manualEmitCount = 2000;
        this.system.start();
    }

    stop() {
        this.system.stop();
    }

    dispose() {
        this.system.dispose();
        this.emitter.dispose();
    }
}