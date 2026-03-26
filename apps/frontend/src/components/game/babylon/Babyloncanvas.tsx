"use client";

import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core" ;
import { createScene } from "@/lib/babylon/createScene";
import { io } from "socket.io-client";

interface LobbyProps {
  msgToServer: (data: string) => void;
  lastReceivedMsg: string;
  socket: any;
}

export default function BabylonCanvas({ msgToServer, lastReceivedMsg, socket }: LobbyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    let disposed = false;

    createScene(canvas, engine, socket, msgToServer).then((scene) => {
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
      const cleanup = (canvas as HTMLCanvasElement & { __babylonCleanup?: () => void }).__babylonCleanup;
      cleanup?.();
    };
  }, 
  []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
}