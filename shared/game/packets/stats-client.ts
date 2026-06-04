import axios from "axios";


// type AchievResult = {
//   userId: string;
//   type: string;
//   name: string;
//   description?: string;
//   icon?: string;
//   xpReward?: number;
//   points?: number;
//   progress?: number;
//   progressTarget?: number;
//   achieved: boolean;
//   meta?: Record<string, unknown>;
// };

// export async function createAchievement(user: AchievResult): Promise<void> {
//   const payload: Record<string, unknown> = {
//     userId: user.userId,
//     type: "marathon-mayem",
//     name: "Marathon Mayem",
//     description: "Travel 20 meters total",
//     achieved: true,
//     progress: user.progress,
//     progressTarget: user.progressTarget,
//     meta: { distance: user.meta },
//   };

//   const url = 'http://stats_service:3000/internal/stats/achievements';

//   await axios.post(url, payload, {
//     headers: { 'x-service-name': 'auth_service' },
//     timeout: 2000,
//   });
// }
export interface CreateAchievementPayload {
	userId: string;
	type: string;
	name: string;
	description?: string;
	icon?: string;
	xpReward?: number;
	points?: number;
	progress?: number;
	progressTarget?: number;
	achieved: boolean;
	meta?: Record<string, unknown>;
}

export async function createAchievement(payload: CreateAchievementPayload) {
  const url = "http://stats_service:3000/internal/stats/achievements";

  await axios.post(url, payload, {
    headers: { "x-service-name": "game_service" },
    timeout: 2000,
  });
}