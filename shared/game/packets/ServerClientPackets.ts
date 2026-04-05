// import * from 'ServerClientPackets.ts';

const prefix = "SC_"

export enum SC_Type {
	SC_DEV_StartConnecting =	prefix + "DEV_StartConnecting",
	SC_InvalidState =			prefix + "InvalidState",
	SC_StartLobby =				prefix + "StartLobby",
	SC_ConnectFail =			prefix + "ConnectFail",
	SC_ConnectSuccess =			prefix + "ConnectSuccess",
	SC_ClientDisconnect =		prefix + "ClientDisconnect",
	SC_ClientJoin =				prefix + "ClientJoin",
	SC_LobbyData =				prefix + "LobbyData",
	SC_ReadyChange =			prefix + "ReadyChange",
	SC_StartLoading = 			prefix + "StartLoading",
	SC_FinishedLoading =		prefix + "FinishedLoading",
	SC_FailedLoading =			prefix + "FailedLoading",
	SC_LoadingProgress =		prefix + "LoadingProgress",
	SC_StartGame =				prefix + "StartGame",
	SC_GameFinished =			prefix + "GameFinished",
	SC_DEV_ButtonPress =		prefix + "DEV_ButtonPress",
	SC_DEV_Periodic =			prefix + "DEV_Periodic",
}

// CONNECTION =================================================================

/**
 * Sent when clients should go back to connecting phase
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_DEV_StartConnecting {
	type: SC_Type.SC_DEV_StartConnecting,
	lobbyId: number,
	seq: Array<number>,
}

/**
 * Sent when server reached invalid state
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_InvalidState {
	type: SC_Type.SC_InvalidState,
	lobbyId: number,
	seq: Array<number>,
}

/**
 * Sent so Clients move to Lobby state
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_StartLobby {
	type: SC_Type.SC_StartLobby,
	lobbyId: number,
	seq: Array<number>,
}

// LOBBY ======================================================================

/**
 * Response from a Server, when a ConnectAttempt is sent,
 * and the Server refuses access to the lobby
 * @param msg specifies Reason why Client was rejeced
 */
export interface SC_ConnectFail {
	type: SC_Type.SC_ConnectFail,
	msg: string,
	seq: Array<number>,
}

/**
 * Response from a Server, when a ConnectAttempt is sent,
 * and the Server accepts the connection to the lobby
 * @param userId Id to identify this player
 */
export interface SC_ConnectSuccess {
	type: SC_Type.SC_ConnectSuccess,
	userId: number,
	seq: Array<number>,
}

/**
 * Sent to all clients when a new player disconnects the lobby,
 * to inform Client to un-render player
 * @param userId Id to identify the disconnecting player
 * @param lobbyId Id of lobby this interaction is for
 */
export interface SC_ClientDisconnect {
	type: SC_Type.SC_ClientDisconnect,
	userId: number,
	lobbyId: number,
	seq: Array<number>,
}

// TODO: Link a player who joins to an existing account from our database,
// so we can associate some name with it

/**
 * Sent to all clients when a new player joins the lobby,
 * to inform Client to render new player
 * @param userId Id to identify the joining player
 * @param lobbyId Id of lobby this interaction is for
 */
export interface SC_ClientJoin {
	type: SC_Type.SC_ClientJoin,
	userId: number,
	lobbyId: number,
	seq: Array<number>,
}

/**
 * Represents 1 filled player slot in the lobby
 * @param userId unique number to identify the user with
 * @param name Name for that player UNUSED
 * @param indexInLobby Position that this player occupies in the lobby
 * @param ready wether the player is ready or not
 */
export interface PlayerInLobby {
	userId: number,
	name: string,
	indexInLobby: number,
	ready: boolean,
	seq: Array<number>,
}

/**
 * Sent to all clients when a new player joins the lobby,
 * to inform Client to render new player
 * @param userId Id to identify the joining player
 * @param lobbyData Array of information about all the players in a lobby
 */
export interface SC_LobbyData {
	type: SC_Type.SC_LobbyData,
	lobbyId: number,
	lobbyData: Array<PlayerInLobby>,
	seq: Array<number>,
}

/**
 * Sent to inform other users of client changing readiness state
 * @param lobbyId Id of the relevant lobby
 * @param userId Id of the relevant user
 * @param ready New state the user arrived at
 */
export interface SC_ReadyChange {
	type: SC_Type.SC_ReadyChange,
	lobbyId: number,
	userId: number,
	ready: boolean,
	seq: Array<number>,
}

/**
 * Sent so Clients move to Loading state
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_StartLoading {
	type: SC_Type.SC_StartLoading,
	lobbyId: number,
	seq: Array<number>,
}

// LOADING ====================================================================

/**
 * Sent when a user or the server finished loading
 * @param lobbyId Id of the relevant lobby, 0 = server
 * @param userId Id of the relevant user
 */
export interface SC_FinishedLoading {
	type: SC_Type.SC_FinishedLoading,
	lobbyId: number,
	userId: number,
	seq: Array<number>,
}

/**
 * Sent when a user or the server failed loading
 * @param lobbyId Id of the relevant lobby
 * @param userId Id of the relevant user, 0 = server
 * @param msg Reason why loading failed
 */
export interface SC_FailedLoading {
	type: SC_Type.SC_FailedLoading,
	lobbyId: number,
	userId: number,
	msg: string,
	seq: Array<number>,
}

/**
 * Sent when a user or the server failed loading
 * @param lobbyId Id of the relevant lobby
 * @param progress Number from 0 to 100 about how finished the loading is
 * @param msg Optional text about the loading step that was last acomplished
 */
export interface SC_LoadingProgress {
	type: SC_Type.SC_LoadingProgress,
	lobbyId: number,
	progress: number,
	msg: string,
	seq: Array<number>,
}

/**
 * Sent when loading has finished for all parties, 
 * so clients move to Game state
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_StartGame {
	type: SC_Type.SC_StartGame,
	lobbyId: number,
	seq: Array<number>,
}

// GAME =======================================================================

/**
 * Sent when game has finished so clients move to Endscreen
 * @param lobbyId Id of the relevant lobby
 */
export interface SC_GameFinished {
	type: SC_Type.SC_GameFinished,
	lobbyId: number,
	seq: Array<number>,
}

/**
 * DEV packet, should be removed later, only exists for the button proxy example
 * Sent when server proxies back the clients button press
 * @param lobbyId Id of the relevant lobby
 * @param timestamp Timestamp when press occured
 * @param msg string that specifies how many times button pressed
 */
export interface SC_DEV_ButtonPress {
	type: SC_Type.SC_DEV_ButtonPress,
	lobbyId: number,
	timestamp: number,
	msg: string,
	seq: Array<number>,
}

/**
 * DEV packet, should be removed later, only exists for the button proxy example
 * Sent every few seconds periodically
 * @param lobbyId Id of the relevant lobby
 * @param msg string that specifies time passed
 */
export interface SC_DEV_Periodic {
	type: SC_Type.SC_DEV_Periodic,
	lobbyId: number,
	msg: string,
	seq: Array<number>,
}

// ENDSCREEN ==================================================================


export type SC_GenericPacket = 
			SC_DEV_StartConnecting | SC_InvalidState | SC_StartLobby |
			SC_ConnectFail | SC_ConnectSuccess | SC_ClientDisconnect | 
			SC_ClientJoin | SC_LobbyData | SC_ReadyChange | 
			SC_StartLoading | SC_FinishedLoading | SC_FailedLoading | 
			SC_LoadingProgress | SC_StartGame | SC_GameFinished |
			SC_DEV_ButtonPress | SC_DEV_Periodic
			;

export type SC_GenericStatePacket = SC_StartLobby | SC_StartLoading | SC_StartGame | SC_InvalidState;