import { Scene } from '@babylonjs/core';
import { Worm } from './Worm';
import { wormData } from '@/shared/packets/util';

/**
 * @brief Class representing a Player
 * @param id unique identifier for player
 * @param name string that represents the displayed name of the player
 * @param worms Array of Worm objects that this player owns/controls
 * @function removeWorm Removes worm from Players control
 * @function dispose Cleans up object
 */

export class Player {
  public readonly id: string;
  public readonly name: string;
  public worms: Array<Worm>;
  public slot: number;
  constructor(
    id: string,
    name: string,
    slot: number,
    worms: Array<wormData>,
    scene: Scene,
    maxWormHealth: number,
  ) {
    this.id = id;
    this.name = name;
    this.slot = slot;
    this.worms = [];
    worms.forEach((worm: wormData) => {
      this.worms.push(new Worm(scene, worm, maxWormHealth));
    });
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
        return;
      }
    }
  }

  /**
   * @brief Deletes all the worms associated with this player, used for cleanup
   */
  dispose() {
    this.worms.forEach((worm) => {
      worm.dispose();
    });
    this.worms = [];
  }
}
