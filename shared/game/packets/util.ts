import { SC_Type } from "./ServerClientPackets";

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
 * @param slot number for which slot this player is in (0-3)
 * @param name displayed name for this player
 * @param worms Array of data to create the worms for that player
 */
export interface playerData {
	id: string,
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
 * @param turnOrder order based on slot numbers (0-3)
 */
export interface gameData {
	players: Array<playerData>
	map: mapData;
}

// For checking if the packet contains data that lobby frontend should take care of
export const lobbyDataPackets = [
	SC_Type.SC_LobbyData,
	SC_Type.SC_ReadyChange,
	SC_Type.SC_ClientJoin,
	SC_Type.SC_ClientDisconnect
];