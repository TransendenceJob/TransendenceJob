// import * from 'ServerClientPackets.ts';


/**
 * ADDING A NEW PACKET
 * 1) Create an enum in the SC_Type table
 * 2) Create an interface based on the existing schema
 * 	1] Name should be SC_ and then CamelCase what its for
 * 	2] Should inherit from SC_Base
 * 	3] It should have a type parameter, which will be the enum from 1)
 * 3) Add the interface name into the union type at the end
 */


export enum SC_Type {
	SC_DEV_StartConnecting =	"SC_DEV_StartConnecting",
	SC_InvalidState =			"SC_InvalidState",
	SC_StartLobby =				"SC_StartLobby",
	SC_ConnectFail =			"SC_ConnectFail",
	SC_ConnectSuccess =			"SC_ConnectSuccess",
	SC_ClientDisconnect =		"SC_ClientDisconnect",
	SC_ClientJoin =				"SC_ClientJoin",
	SC_LobbyData =				"SC_LobbyData",
	SC_ReadyChange =			"SC_ReadyChange",
	SC_StartLoading = 			"SC_StartLoading",
	SC_FinishedLoading =		"SC_FinishedLoading",
	SC_FailedLoading =			"SC_FailedLoading",
	SC_LoadingProgress =		"SC_LoadingProgress",
	SC_StartGame =				"SC_StartGame",
	SC_GameFinished =			"SC_GameFinished",
	SC_DEV_ButtonPress =		"SC_DEV_ButtonPress",
	SC_DEV_Periodic =			"SC_DEV_Periodic",
	SC_DEV_GameState =			"SC_DEV_GameState",
}

/**
 * Fields used in ALL packets:
 * @param type: SC_Type enum as string to identify package
 * @param lobbyId identifying number for which lobby this packet is meant
 * @param seq Array that specifies the id of the packets sent out before this one
 */
export interface SC_Base {
	lobbyId: number,
	seq: Array<number>,
}

// CONNECTION =================================================================

/**
 * Sent when clients should go back to connecting phase
 */
export interface SC_DEV_StartConnecting extends SC_Base {
	type: SC_Type.SC_DEV_StartConnecting,
}

/**
 * Sent when server reached invalid state
 */
export interface SC_InvalidState extends SC_Base {
	type: SC_Type.SC_InvalidState,
}

/**
 * Sent so Clients move to Lobby state
 */
export interface SC_StartLobby extends SC_Base {
	type: SC_Type.SC_StartLobby,
}

// LOBBY ======================================================================

/**
 * Response from a Server, when a ConnectAttempt is sent,
 * and the Server refuses access to the lobby
 * @param msg specifies Reason why Client was rejeced
 */
export interface SC_ConnectFail extends SC_Base {
	type: SC_Type.SC_ConnectFail,
	msg: string,
}

/**
 * Response from a Server, when a ConnectAttempt is sent,
 * and the Server accepts the connection to the lobby
 * @param userId Id to identify this player
 */
export interface SC_ConnectSuccess extends SC_Base {
	type: SC_Type.SC_ConnectSuccess,
	userId: number,
}

/**
 * Sent to all clients when a new player disconnects the lobby,
 * to inform Client to un-render player
 * @param userId Id to identify the disconnecting player
 */
export interface SC_ClientDisconnect extends SC_Base {
	type: SC_Type.SC_ClientDisconnect,
	userId: number,
}

// TODO: Link a player who joins to an existing account from our database,
// so we can associate some name with it

/**
 * Sent to all clients when a new player joins the lobby,
 * to inform Client to render new player
 * @param userId Id to identify the joining player
 */
export interface SC_ClientJoin extends SC_Base {
	type: SC_Type.SC_ClientJoin,
	userId: number,
}

/**
 * NOT A PACKET, just utility
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
export interface SC_LobbyData extends SC_Base {
	type: SC_Type.SC_LobbyData,
	userId: number,
	lobbyData: Array<PlayerInLobby>,
}

/**
 * Sent to inform other users of client changing readiness state
 * @param userId Id of the relevant user
 * @param ready New state the user arrived at
 */
export interface SC_ReadyChange extends SC_Base {
	type: SC_Type.SC_ReadyChange,
	userId: number,
	ready: boolean,
}

/**
 * Sent so Clients move to Loading state
 */
export interface SC_StartLoading extends SC_Base {
	type: SC_Type.SC_StartLoading,
}

// LOADING ====================================================================

/**
 * Sent when a user or the server finished loading
 * @param userId Id of the relevant user
 */
export interface SC_FinishedLoading extends SC_Base {
	type: SC_Type.SC_FinishedLoading,
	userId: number,
}

/**
 * Sent when a user or the server failed loading
 * @param userId Id of the relevant user, 0 = server
 * @param msg Reason why loading failed
 */
export interface SC_FailedLoading extends SC_Base {
	type: SC_Type.SC_FailedLoading,
	userId: number,
	msg: string,
}

/**
 * Sent when a user or the server failed loading
 * @param progress Number from 0 to 100 about how finished the loading is
 * @param msg Optional text about the loading step that was last acomplished
 */
export interface SC_LoadingProgress extends SC_Base {
	type: SC_Type.SC_LoadingProgress,
	progress: number,
	msg: string,
}

/**
 * Sent when loading has finished for all parties, 
 * so clients move to Game state
 */
export interface SC_StartGame extends SC_Base {
	type: SC_Type.SC_StartGame,
}

// GAME =======================================================================

/**
 * Sent when game has finished so clients move to Endscreen
 */
export interface SC_GameFinished extends SC_Base {
	type: SC_Type.SC_GameFinished,
}

/**
 * DEV packet, should be removed later, only exists for the button proxy example
 * Sent when server proxies back the clients button press
 * @param timestamp Timestamp when press occured
 * @param msg string that specifies how many times button pressed
 */
export interface SC_DEV_ButtonPress extends SC_Base {
	type: SC_Type.SC_DEV_ButtonPress,
	timestamp: number,
	msg: string,
}

/**
 * DEV packet, should be removed later, only exists for the button proxy example
 * Sent every few seconds periodically
 * @param msg string that specifies time passed
 */
export interface SC_DEV_Periodic extends SC_Base {
	type: SC_Type.SC_DEV_Periodic,
	msg: string,
}

/**
 * DELETE ME DEBUG ONLY
 */
export interface SC_DEV_GameState extends SC_Base {
	type: SC_Type.SC_DEV_GameState,
	msg: string
}

// ENDSCREEN ==================================================================


export type SC_GenericPacket = 
			SC_DEV_StartConnecting | SC_InvalidState | SC_StartLobby |
			SC_ConnectFail | SC_ConnectSuccess | SC_ClientDisconnect | 
			SC_ClientJoin | SC_LobbyData | SC_ReadyChange | 
			SC_StartLoading | SC_FinishedLoading | SC_FailedLoading | 
			SC_LoadingProgress | SC_StartGame | SC_GameFinished |
			SC_DEV_ButtonPress | SC_DEV_Periodic | SC_DEV_GameState
			;

export type SC_GenericStatePacket = SC_StartLobby | SC_StartLoading | SC_StartGame | SC_InvalidState;