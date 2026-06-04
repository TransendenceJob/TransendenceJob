
const handleCreateAchievement = async () => {
	const token = sessionStorage.getItem("auth.accessToken");


	const payload = {
		userId: "417bafc1-5f9e-4045-a23c-168b7c0c5d0c",
		type: "sharp_shooter 50",
		name: "Marathon-Mayem by Philipp!",
		description: "Walk 20 meters",
		icon: "🎯",
		xpReward: 100,
		points: 20,
		progress: 10,
		progressTarget: 10,
		achieved: true,
		meta: { weapon: "bazooka" },
	};

	try {
		const res = await fetch("http://stats_service:3000/internal/stats/achievements", {
			method: "POST",
			headers: { 'x-service-name': 'game_service' },
			body: JSON.stringify(payload),
		});

		if (!res.ok) throw new Error("Failed to create achievement");
			console.log("Achievement created");
	}
	catch (err) {
		console.error(err);
	}
};

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

	constructor(){}

	addToDistance = async (amount: number) =>{
		this.distanceCounter += amount;
		if (this.distanceCounter >= this.marathonDistance && !this.achievements["marathon-mayem"])
		{
			await handleCreateAchievement();
			this.achievements["marathon-mayem"] = true;
			console.log("achievement unlocked!: marathon-mayem");
		}
	}
}