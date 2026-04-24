//@ts-ignore
import { IAction, Scene } from '@babylonjs/core';
import { Turn } from "../../state/Turn";

export interface IAimType {
	activate(turn: Turn): Array<IAction>;
	deactivate(scene: Scene): void;
}

// Have unique identifiers, eahco f which calls a function