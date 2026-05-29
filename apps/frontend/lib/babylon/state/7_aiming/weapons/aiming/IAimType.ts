import { IAction, Scene } from '@babylonjs/core';
import { Turn } from "@/lib/babylon/state/4_turn_start/Turn";

export interface activateParam {
	turn: Turn | undefined,
	scene: Scene,
	broadcast: (msg: string) => void,
}

export interface IAimType {
	activate(data: activateParam): void;
	deactivate(scene: Scene): void;
}

// Have unique identifiers, eahco f which calls a function