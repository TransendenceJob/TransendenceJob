import { ExecuteCodeAction, ActionManager, Scene } from '@babylonjs/core';
import { Worm } from './worms/Worm';
import { playerData, wormData } from '@/shared/packets/util';

/**
 * @brief Class representing a Player
 * @param id unique identifier for player
 * @param name string that represents the displayed name of the player
 * @param worms Array of Worm objects that this player owns/controls
 * @function addWorm Adds worm to Players control
 * @function addWorms Adds multiple worms to Players control
 * @function removeWorm Removes worm from Players control
 * @function dispose Cleans up object
 */
export class Player {
	public readonly id: string;
	public readonly name: string;
	public worms: Array<Worm>;
	private clickableAction: ExecuteCodeAction;
	constructor(scene: Scene, data: playerData) {
		this.id = data.id;
		this.name = data.name;
		this.worms = [];
		data.worms.forEach((worm: wormData) => {
			this.worms.push(new Worm(scene, worm, data.slot));
		});
		this.clickableAction = new ExecuteCodeAction(ActionManager.OnPickUpTrigger, () => {});
	}

	/**
	 * Returns another worm
	 * @param forward Wether we are movign forward or backward through array
	 * @param oldWorm Old chosen worm, from which to choose next
	 * @returns the next worm
	 * @note This could be reworked to move through the worms based on their x position
	 */
	getNextWorm(forward: boolean, oldWorm: Worm) {
		let index = this.worms.findIndex((worm) => worm.id == oldWorm.id);

		if (index == -1)
			return (this.worms[0]);
		if (forward)
			index++;
		else
			index--;

		if (index >= this.worms.length) {
			return (this.worms[0]);
		}
		if (index < 0) {
			return (this.worms[this.worms.length - 1]);
		}
		return (this.worms[index]);
	}

	initPickWorm(setChosen: (chosen: Worm) => void) {
		this.worms.forEach((worm) => {
			worm.initClickable(setChosen);
		})
	}

	wormsClickable(yes: boolean) {
		if (yes)
			this.worms.forEach((worm) => {worm.makeClickable()});
		else
			this.worms.forEach((worm) => {worm.removeClickable()});
	}

	/**
	 * @brief Makes Player track a worm that can be controlled
	 * @param worm worm to add
	 */
	addWorm(worm: Worm) {
		this.worms.push(worm);
	}

	/**
	 * @brief Makes Player track multiple worms that can be controlled
	 * @param worms Array of worms to add
	 */
	addWorms(worms: Array<Worm>) {
		for (let i = 0; i < worms.length; i++)
			if (worms[i])
				this.worms.push(worms[i]);
	}


	/**
	 * @brief Makes Player track a worm that can be controlled
	 * @param id identifier by which to distinguish that worm
	 * @note in case multiple worms have same id, removes the first one
	 */
	removeWorm(id: number) {
		for (let i = 0; i < this.worms.length; i++) {
			if (this.worms[i].id == id) {
				this.worms[i].dispose();
				this.worms.splice(i, 1);
				return ;
			}
		}
	}

	/**
	 * @brief Deletes all the worms associated with this player, used for cleanup
	 */
	dispose() {
		this.worms.forEach((worm) => {
			worm.dispose();
		})
		this.worms = [];
	}

}