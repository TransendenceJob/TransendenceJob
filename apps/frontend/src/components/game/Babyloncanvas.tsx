"use client";

import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core";
import { createGameScene } from "@/lib/babylon/gameScene";

export default function BabylonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    let disposed = false;

    createGameScene(engine, canvas).then((scene) => {
      if (disposed) {
        scene.dispose();
        engine.dispose();
        return;
      }

      engine.runRenderLoop(() => {
        scene.render();
      });

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);

      const cleanup = () => {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
      };

      (canvas as HTMLCanvasElement & { __babylonCleanup?: () => void }).__babylonCleanup = cleanup;
    });

    return () => {
      disposed = true;
      const cleanup = (canvas as HTMLCanvasElement & { __babylonCleanup?: () => void }).__babylonCleanup;
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
}