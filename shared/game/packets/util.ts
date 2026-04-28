/**
 * Represent data of 1 worm
 */
export interface wormData {
	pos_x: number,
	pos_y: number
}

/**
 * Represent data of 1 player
 */
export interface playerData {
	name: string,
	id: number,
	worms: Array<wormData>
}

/**
 * Interface that holds all data for starting a game
 */
export interface gameData {
	players: Array<playerData>
}