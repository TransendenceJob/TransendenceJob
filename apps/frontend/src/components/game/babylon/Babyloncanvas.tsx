"use client";

import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core" ;
import { createScene } from "@/lib/babylon/createScene";
import { Socket } from 'socket.io-client';

interface Params {
  msgToServer: (data: string) => void;
  socket: Socket;
  DEBUG: boolean;
}

export default function BabylonCanvas({ msgToServer, socket, DEBUG}: Params) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
 
  // Update our msgToServer function, once it has changed,
  // which happens if the SubPages rerenders due to the Socket connecting
  // Essentially this ensures that our msgToServer function will always get a stable socket connection
  const msgRef = useRef(msgToServer);
  useEffect(() => {
    msgRef.current = msgToServer;
  }, [msgToServer]);

  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    let disposed = false;

    createScene(canvas, engine, socket, msgRef.current, DEBUG).then((scene) => {
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