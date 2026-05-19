import { Client, resetClient } from '@/shared/packets/Client';

/**
 * If we store only the Clients,
 * initialising with empty array leads to accessing invalid memory
 * If we stoe the index,
 */

export class ClientManager {
	public roundStart: boolean;
	public clients: Array<Client>;
	private activeIndex: number;
	constructor(goal: Array<Client>) {
		this.clients = goal;
		this.roundStart = true;
		this.activeIndex = 0;
	}

	restart() {
		this.roundStart = true;
		this.activeIndex = 0;
	}

	/**
	 * Makes the next Client in the list active,
	 * or sets the first one, if roundStart is true
	 */
	getNextClient() {
		if (this.roundStart) {
			this.roundStart = false;
			this.activeIndex = 0;
		}
		else {
			this.activeIndex = (this.activeIndex + 1) % this.clients.length;
		}
		return (this.getActive())	
	}

	/**
	 * @returns the currently active Client
	 * @warning will always throw error, if no client registered
	 */
	getActive() {
		if (this.activeIndex >= this.clients.length)
			throw new Error(`Cannot access client in position ${this.activeIndex} of ${this.clients.length} clients`);
		return (this.clients[this.activeIndex]);
	}

	resetClients() {
		this.clients.forEach((client) => {
			resetClient(client);
		})
	}

	remove(id: string) {
		if (this.clients.length == 0)
			return ;
		const index = this.clients.findIndex((client) => client.id == id);
		this.clients.splice(index, 1);
	}

	/**
	 * @returns index of the Client with the specified id or -1
	 */
	getIndex(id: string): number {
		if (this.clients.length == 0)
			return -1;
		return (this.clients.findIndex((client) => client.id == id));
	}

	/**
	 * @returns undefined or the Client with the specified id
	 */
	get(id: string): Client | undefined {
		if (this.clients.length == 0)
			return undefined;
		return (this.clients.find((client) => client.id == id));
	}
}