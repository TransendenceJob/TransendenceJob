import axios from "axios";

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

export async function updateAchievement(payload: CreateAchievementPayload) {
  const url = "http://stats_service:3000/internal/stats/achievements/upsert";

  await axios.post(url, payload, {
    headers: { "x-service-name": "game_service" },
    timeout: 2000,
  });
}