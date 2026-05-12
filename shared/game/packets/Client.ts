/**
 * @param progress number from 0-100 represents percentage how much client has loaded
 * @param msg Message field for what last step of loading was, or for error messages
 * @param done set to true, once client finishes loading
 * @param failed set to true, when the client encounters an error during loading
 */
export interface LoadingStatus {
  progress: number;
  msg: string;
  done: boolean;
  failed: boolean;
}

/**
 * Represents 1 filled player slot in the lobby
 * @param id unique number to identify the user with
 * @param name Name from the database
 * @param slot Position that this player occupies in the lobby
 * @param ready whether the player is ready or not
 * @param loading stores info on clients loading progress
 */
export interface Client {
  id: string;
  name: string;
  slot: number;
  ready: boolean;
  loading: LoadingStatus;
}

/**
 * Creates a new entry for a Client and returns it
 * @warning Expects there to be a valid position for the Client in the list
 */
export function makeClient(id: string, name: string, clients: Array<Client>): Client {
	const takenSlots = new Set(clients.map((client) => client.slot));
	let slot = 0;
	while (takenSlots.has(slot)) {
		slot++;
	}

	const new_client: Client = {
		id: id,
		name: name,
		slot: slot,
		ready: false,
		loading: {
			progress: 0,
			msg: 'Starting Loading',
			done: false,
			failed: false,
		}
	}
	return (new_client)
}

/**
 * Sets a Clients data back to scratch, except for identifiers
 */
export function resetClient(client: Client) {
  client.ready = false;
  client.loading.progress = 0;
  client.loading.msg = 'Starting Loading';
  client.loading.done = false;
  client.loading.failed = false;
}
