// @ts-ignore
import { IAction } from '@babylonjs/core'

export interface IState {

	/**
	 * Called when this state is reached, which happens when the server says so
	 */
	enter(): Array<IAction>;

	/**
	 * Called each frame, after packets have been handled, and before scene is rendered
	 */
	tick(): void;

	/**
	 * Called when State is exited (which happens when a new state is entered)
	
	 */
	exit(): void;

	/**
	 * This should reset the object entirely, because we only ever create one on canvas creation
	 * That means that any member properties should be set back to their initial values
	 * This should be called AT LEAST once in either exit or enter
	 */
	reset(): void;
}