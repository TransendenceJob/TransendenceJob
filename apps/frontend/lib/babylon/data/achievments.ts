
export class Achievements {

	private achievements: any =
	{
		"marathon-mayem": false,
		"the early bird catches the worm!": false,
		"first blood!": false,
		"jump, JUMP, JUMP!!!": false,
		"eagle eye": false,
		"chip-in!": false
	}

	private distanceCounter: number = 0;
	private marathonDistance: number = 20;

	constructor() {}

	addToDistance(amount: number){
		this.distanceCounter += amount;
		if (this.distanceCounter >= this.marathonDistance && !this.achievements["marathon-mayem"])
		{
			this.achievements["marathon-mayem"] = true;
			console.log("achievement unlocked!: marathon-mayem");
		}
	}
}