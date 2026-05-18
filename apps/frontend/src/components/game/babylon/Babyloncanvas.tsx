"use client";
import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core" ;
import { Socket } from 'socket.io-client';
import { Client } from '@/shared/packets/Client';


import { createScene } from "@/lib/babylon/createScene";
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import { useGameContext } from '../lobby/GameContext';

export default function BabylonCanvas() {
  const {lobbyId, socketRef, msgToServer, userId, DEBUG} = useGameContext();

  // Persistant references for better memory handling
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const cleanupRef = useRef<() => void | undefined>(undefined);
  const resizeUiRef = useRef<() => void | undefined>(undefined);

  // Update our msgToServer function, once it has changed,
  // which happens if the SubPages rerenders due to the Socket connecting
  // Essentially this ensures,
  //  that our msgToServer function will always get a stable socket connection
  const msgRef = useRef(msgToServer);
  useEffect(() => {
    msgRef.current = msgToServer;
  }, [msgToServer]);

  // React runs this twice to check for bugs
  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas ) return;

    // This exists, because the game canvas starts hidden, 
    // with 0x0 dimensions, and needs to redo the UI when it appears
    const observer = new ResizeObserver(() => {
      if (engineRef.current && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        engineRef.current.resize();
      }
      resizeUiRef.current?.();
    });
    observer.observe(canvas);

    // Create and capture engine for better memory handling
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    engineRef.current = engine;

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    createScene(canvas, engine, socketRef, msgRef.current, lobbyId, userId, DEBUG).then(({scene, resizeUi, cleanup}) => {
      // Since its an async function, if the engine is disposed after scene Creation, dispose scene
      if (engine.isDisposed) {
        cleanup?.();
        scene.dispose();
        return;
      }
      cleanupRef.current = cleanup;
      resizeUiRef.current = resizeUi;

      engine.runRenderLoop(() => {
        scene.render();
      });
    });

    // React uses this on termination of element for memory cleanup
    return () => {
      window.removeEventListener("resize", resize);
      cleanupRef.current?.();
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      observer.disconnect();
    };
  }, 
  [DEBUG, userId]);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
}