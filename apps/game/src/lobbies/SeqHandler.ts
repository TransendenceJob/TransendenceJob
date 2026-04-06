/**
 * Class to hold seq values
 * Theese are important for clients to identify package order,
 * and if a package was dropped along the way.
 * Anytime a package is sent, be it to one, or all, we add a new seq number to all arrays, which is 1 bigger then the last.
 * When a client receives a packet from the server, it gets the numbers stored for that client sent in the seq field.
 * So if we start at 0, then Client A gets sent 3 packets, they get:
 * seq: [0], seq: [1], seq: [2],
 * Then if Client B gets sent a packet, they get:
 * seq: [0, 1, 2, 3]
 */
export class SeqHandler {
	private map: Array<{id: number | undefined, value: Array<number>}>;
	private lastSeq: number;
	private playerCount: number;

	/**
	 * Creates slots for sequence numbers
	 * @param playerCount creates this many slots
	 */
	constructor(playerCount: number) {
		this.map = new Array(playerCount);
		for (let i = 0; i < playerCount; i++)
			this.map[i] = {id: undefined, value: []};
		this.lastSeq = 0;
		this.playerCount = playerCount;
	};

	/**
	 * Returns the last sequence number
	 * If any Client does not have this as their last number,
	 * they missed a package
	 */
	public getLastSeq(): number {
		return (this.lastSeq);
	};

	/**
	 * A client requests their seq numbers with this,
	 * which returns them and removes them from the internal list
	 * @param target userId of the player whoose seq is requested
	 * @returns Array of seq numbers 
	 */
	getSeq(target: number): Array<number> | undefined {
		var pos: number = 0;
		for (; pos < this.playerCount; pos++) {
			if (this.map[pos].id == target) {
				break ;
			}
		}
		if (pos == this.playerCount)
			return ([]) ;
		const copy: Array<number> = this.map[pos].value;
		this.map[pos].value = [];
		return (copy);
	}

	/**
	 * Used when a new seq number should be added to all arrays
	 */
	increase() {
		this.lastSeq++;
		for (let i = 0; i < this.playerCount; i++) {
			if (this.map[i].id != undefined)
				this.map[i].value.push(this.lastSeq);
		}
	}

	/**
	 * Players need to be identified by their userId,
	 * and stored in an array at a certain position
	 * @note Will overwrite old players if position overlaps
	 * @param userId Id of the player, used as alias
	 * @param position position, where the player is stored in the array
	 */
	registerPlayer(userId: number, position: number) {
		if (position < 0 || position > 3)
			return ;
		this.map[position] = {id: userId, value: new Array<number>()};
	}

	/**
	 * For printing purposes
	 */
	toString(): string {
		var msg: string = "";
		for (let i = 0; i < this.playerCount; i++) {
			const current = this.map[i];
			msg += `${this.map[i].id} - ${this.map[i].value}`;
			if (i != this.playerCount - 1)
				msg += "\n";
		}
		return (msg);
	}
}
