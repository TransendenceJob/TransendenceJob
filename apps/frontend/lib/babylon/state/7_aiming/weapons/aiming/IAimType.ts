import { IAction, Scene } from '@babylonjs/core';
import { Turn } from "@/lib/babylon/state/4_turn_start/Turn";

export interface IAimType {
	activate(turn: Turn, scene: Scene): void;
	deactivate(scene: Scene): void;
}

// Have unique identifiers, eahco f which calls a function