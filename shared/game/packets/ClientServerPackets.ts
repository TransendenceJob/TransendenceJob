// import * from 'ClientServerPackets.ts';


/**
 * ADDING A NEW PACKET
 * 1) Create an enum in the CS_Type table
 * 2) Create an interface based on the existing schema
 * 	1] Name should be CS_ and then CamelCase what its for
 * 	2] It should have a type parameter, which will be the enum from 1)
 * 	3] It should inherit from CS_Base
 * 3) Add the interface name into the union type at the end
 */


export enum CS_Type {
	CS_DEV_StartLobby =			"CS_DEV_StartLobby",
	CS_DEV_StartLoading =		"CS_DEV_StartLoading",
	CS_DEV_StartGame =			"CS_DEV_StartGame",
	CS_DEV_StartEndscreen =		"CS_DEV_StartEndscreen",
	CS_DEV_ButtonPress =		"CS_DEV_ButtonPress",
	CS_ConnectAttempt =			"CS_ConnectionAttempt",
	CS_ReadyChange =			"CS_ReadyChange",
	CS_FinishedLoading =		"CS_FinishedLoading",
	CS_FailedLoading =			"CS_FailedLoading",
}

/**
 * Fields used in ALL packets:
 * @param lobbyId identifying number for which lobby this packet is meant
 */
export interface CS_Base {
	lobbyId: number,
}
// CONNECTING =================================================================

/**
 * Sent when a user wants to connect to a lobby
 */
export interface CS_ConnectAttempt extends CS_Base {
	type: CS_Type.CS_ConnectAttempt,
}

// LOBBY ======================================================================

/**
 * Sent when a user changes their readiness state
 * @param userId Id of the relevant user
 * @param ready New state the user arrived at
 */
export interface CS_ReadyChange extends CS_Base {
	type: CS_Type.CS_ReadyChange,
	userId: number,
	ready: boolean,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartLobby extends CS_Base {
	type: CS_Type.CS_DEV_StartLobby,
}

// LOADING ====================================================================

/**
 * Sent when a user finished loading
 * @param userId Id of the relevant user
 */
export interface CS_FinishedLoading extends CS_Base {
	type: CS_Type.CS_FinishedLoading,
	userId: number,
}

/**
 * Sent when a user failed loading
 * @param userId Id of the relevant user
 * @param msg Reason why loading failed
 */
export interface CS_FailedLoading extends CS_Base {
	type: CS_Type.CS_FailedLoading,
	userId: number,
	msg: string,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartLoading extends CS_Base {
	type: CS_Type.CS_DEV_StartLoading,
}

// GAME =======================================================================

/**
 * DEV MODE, delete later
 * For pressing the example button in the scene
 * @param timestamp Timestamp of when press occured
 * @param message Message about button pressing
 */
export interface CS_DEV_ButtonPress extends CS_Base {
	type: CS_Type.CS_DEV_ButtonPress,
	timestamp: number,
	message: string,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartGame extends CS_Base {
	type: CS_Type.CS_DEV_StartGame,
}

// ENDSCREEN ==================================================================

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartEndscreen extends CS_Base {
	type: CS_Type.CS_DEV_StartEndscreen,
}

export type CS_GenericPacket = 
			CS_ConnectAttempt | CS_ReadyChange | CS_DEV_StartLobby |
			CS_FinishedLoading | CS_FailedLoading | CS_DEV_StartLoading |
			CS_DEV_ButtonPress | CS_DEV_StartGame | CS_DEV_StartEndscreen 
			;