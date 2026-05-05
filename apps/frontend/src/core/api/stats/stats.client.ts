import { StatsUser } from "./stats.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: unknown; status: number };

async function handleResponse<T>(res: Response): Promise<ApiResult<T>> {
  const status = res.status;
  if (status === 204)
	return { ok: true, data: ({} as T), status };
  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null);
  return res.ok ? { ok: true, data: data as T, status } : { ok: false, error: data, status };
}


// define statsClient object with two function

export const statsClient = {
	
	// expects BFF endpoint that returns a compact summary for the current user
	async getStatsUsers(accessToken?: string) {

    const url = `${BASE_URL}/stats/users`;
    // eslint-disable-next-line no-console
    console.log('statsClient.getStatsUsers ->', url, { accessToken: !!accessToken });
    const res = await fetch(url, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return handleResponse<StatsUser>(res);
  },

  // fallback: fetch by explicit userId
  async getStatsUserById(userId: string, accessToken?: string) {
    const url = `${BASE_URL}/stats/user/${encodeURIComponent(userId)}`;
    // eslint-disable-next-line no-console
    console.log('statsClient.getStatsUserById ->', url, { userId, accessToken: !!accessToken });
    const res = await fetch(url, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return handleResponse<StatsUser>(res);
  },
};