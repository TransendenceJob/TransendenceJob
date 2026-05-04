export interface pointData {
	x: number,
	y: number,
}

/**
 * Represent data of 1 worm
 * @param id Unique id to identify this specific worm
 * @param pos_x x position to spawn this worm at
 * @param pos_y y position to spawn this worm at
 */
export interface wormData {
	id: number,
	pos: pointData
}

/**
 * Represent data of 1 player
 * @param id will later be changed to string, identifier for player
 * @param slot number for which slot this player is in (1-4)
 * @param name displayed name for this player
 * @param worms Array of data to create the worms for that player
 */
export interface playerData {
	id: number,
	slot: number,
	name: string,
	worms: Array<wormData>
}

export interface mapData {
	points: Array<pointData>
}

/**
 * Interface that holds all data for starting a game
 * @param players Holds data about players and their worms
 */
export interface gameData {
	players: Array<playerData>
}