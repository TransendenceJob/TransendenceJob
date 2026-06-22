export interface entry {
	id: number,
	name: string,
}

/**
 * Unique identifiers so frontend and backend can identify weapoins based on a shared id
 */
export const weaponIds = new Map();
weaponIds.set("Assault Rifle", 0);
weaponIds.set("Air Strike", 1);
weaponIds.set("Falling Piano", 2);
weaponIds.set("Meteor", 3);