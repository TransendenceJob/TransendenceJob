export class Achievements {
	public achievements: Record<string, boolean> = {
		"marathon-mayem": false,
		"the early bird catches the worm!": false,
		"first blood!": false,
		"jump, JUMP, JUMP!!!": false,
		"eagle eye": false,
		"chip-in!": false,
	};

	private distanceCounter = 0;
	private marathonDistance = 20;
	private userId: string;

	constructor(userId: string) {
		this.userId = userId;
		console.log(this.userId);
	}

	async addToDistance(amount: number) {
		this.distanceCounter += amount;

		if (this.distanceCounter >= this.marathonDistance && !this.achievements["marathon-mayem"]) {
			this.achievements["marathon-mayem"] = true;
			console.log("achievement unlocked!: marathon-mayem");
		}
	}
}