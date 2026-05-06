import { IWeapon } from "./IWeapon";

export class Weapons {
	private list: Array<IWeapon>;
	constructor() {
		this.list = new Array<IWeapon>();
	}
}