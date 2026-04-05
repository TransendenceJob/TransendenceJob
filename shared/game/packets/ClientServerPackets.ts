// import * from 'ClientServerPackets.ts';

const prefix = "CS_";

export enum CS_Type {
	CS_DEV_StartLobby =			"CS_DEV_StartLobby",
	CS_DEV_StartLoading =		"CS_DEV_StartLoading",
	CS_DEV_StartGame =			"CS_DEV_StartGame",
	CS_DEV_StartEndscreen =		"CS_DEV_StartEndscreen",
	CS_DEV_ButtonPress =		"CS_DEV_ButtonPress",
	CS_ConnectAttempt =			prefix + "ConnectionAttempt",
	CS_ReadyChange =			prefix + "ReadyChange",
	CS_FinishedLoading =		prefix + "FinishedLoading",
	CS_FailedLoading =			prefix + "FailedLoading",
}

// CONNECTING =================================================================

/**
 * Sent when a user wants to connect to a lobby
 * @param lobbyId Id of the lobby they wish to connect to
 */
export interface CS_ConnectAttempt {
	type: CS_Type.CS_ConnectAttempt,
	lobbyId: number,
}

// LOBBY ======================================================================

/**
 * Sent when a user changes their readiness state
 * @param lobbyId Id of the relevant lobby
 * @param userId Id of the relevant user
 * @param ready New state the user arrived at
 */
export interface CS_ReadyChange {
	type: CS_Type.CS_ReadyChange,
	lobbyId: number,
	userId: number,
	ready: boolean,
}

/**
 * DEV MODE, delete later
 * @param lobbyId Id of the relevant lobby
 */
export interface CS_DEV_StartLobby {
	type: CS_Type.CS_DEV_StartLobby,
	lobbyId: number,
}

// LOADING ====================================================================

/**
 * Sent when a user finished loading
 * @param lobbyId Id of the relevant lobby
 * @param userId Id of the relevant user
 */
export interface CS_FinishedLoading {
	type: CS_Type.CS_FinishedLoading,
	lobbyId: number,
	userId: number,
}

/**
 * Sent when a user failed loading
 * @param lobbyId Id of the relevant lobby
 * @param userId Id of the relevant user
 * @param msg Reason why loading failed
 */
export interface CS_FailedLoading {
	type: CS_Type.CS_FailedLoading,
	lobbyId: number,
	userId: number,
	msg: string,
}

/**
 * DEV MODE, delete later
 * @param lobbyId Id of the relevant lobby
 */
export interface CS_DEV_StartLoading {
	type: CS_Type.CS_DEV_StartLoading,
	lobbyId: number,
}

// GAME =======================================================================

/**
 * DEV MODE, delete later
 * For pressing the example button in the scene
 * @param lobbyId Id of the relevant lobby
 */
export interface CS_DEV_ButtonPress {
	type: CS_Type.CS_DEV_ButtonPress,
	timestamp: number,
	message: string,
	lobbyId: number,
}

/**
 * DEV MODE, delete later
 * @param lobbyId Id of the relevant lobby
 */
export interface CS_DEV_StartGame {
	type: CS_Type.CS_DEV_StartGame,
	lobbyId: number,
}

// ENDSCREEN ==================================================================

/**
 * DEV MODE, delete later
 * @param lobbyId Id of the relevant lobby
 */
export interface CS_DEV_StartEndscreen {
	type: CS_Type.CS_DEV_StartEndscreen,
	lobbyId: number,
}

export type CS_GenericPacket = 
			CS_ConnectAttempt | CS_ReadyChange | CS_DEV_StartLobby |
			CS_FinishedLoading | CS_FailedLoading | CS_DEV_StartLoading |
			CS_DEV_ButtonPress | CS_DEV_StartGame | CS_DEV_StartEndscreen 
			;