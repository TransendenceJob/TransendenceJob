"use client";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function Stats() {
  const token = sessionStorage.getItem("auth.accessToken");
  const headers: HeadersInit = {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			};
  // -----------------------------
  // 1. CREATE PLAYER STATS
  // -----------------------------
  const handleCreatePlayerStats = async () => {
    const payload = {
      userId: "99173503-c17e-4b8c-9ec8-207157f0afbc",
      xp: 50,
      level: 1,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
    };

    try {
      const res = await fetch(`${API_BASE}/stats/user/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create stats");
      console.log("Player stats created");
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // 2. UPDATE PLAYER STATS
  // -----------------------------
  const handleUpdatePlayerStats = async () => {
    const payload = {
      xp: 50,
      level: 4,
      wins: 2,
      losses: 0,
      kills: 13,
      deaths: 2,
    };

    try {
      const res = await fetch(
        `${API_BASE}/stats/user/417bafc1-5f9e-4045-a23c-168b7c0c5d0c`,
        {
          method: "PUT",
          headers:  headers,
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update stats");
      console.log("Player stats updated");
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // 3. CREATE MATCH
  // -----------------------------
  const handleCreateMatch = async () => {
    const payload = {
      status: "FINISHED",
      duration: 840,
      mode: "Ranked Skirmish",
      mapName: "Rust Canyon",
      score: "3 - 1",
      summary: "Clean rotations and a decisive final blast.",
      endedAt: "2026-05-31T19:42:00.000Z",
      participants: [
        {
          userId: "a124f36d-5736-46e3-95e8-7a7e003e73e5",
          displayName: "You",
          avatarUrl: null,
          isWinner: true,
          kills: 5,
          deaths: 1,
        },
        {
          userId: "99173503-c17e-4b8c-9ec8-207157f0afbc",
          displayName: "BoomRanger",
          avatarUrl: null,
          isWinner: false,
          kills: 3,
          deaths: 2,
        },
      ],
    };

    try {
      const res = await fetch(`${API_BASE}/stats/match/`, {
        method: "POST",
        headers:  headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create match");
      console.log("Match created");
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // 4. CREATE ACHIEVEMENT
  // -----------------------------
  const handleCreateAchievement = async () => {
    const payload = {
      userId: "417bafc1-5f9e-4045-a23c-168b7c0c5d0c",
      type: "sharp_shooter 50",
      name: "Sharp Shooterrrrr",
      description: "Hit 10 accurate shots",
      icon: "🎯",
      xpReward: 100,
      points: 20,
      progress: 10,
      progressTarget: 10,
      achieved: true,
      meta: { weapon: "bazooka" },
    };

    try {
      const res = await fetch(`${API_BASE}/stats/achievements`, {
        method: "POST",
        headers:  headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create achievement");
      console.log("Achievement created");
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // 5. UPSERT ACHIEVEMENT
  // -----------------------------
  const handleUpdateAchievement = async () => {
    const payload = {
      userId: "a124f36d-5736-46e3-95e8-7a7e003e73e5",
      type: "sharp_shooter 2334",
      name: "Sharp Shooter werwerwer",
      progress: 12,
      progressTarget: 10,
      achieved: true,
    };

    try {
      const res = await fetch(
        `${API_BASE}/stats/achievements/upsert`,
        {
          method: "POST",
          headers:  headers,
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to upsert achievement");
      console.log("Achievement upserted");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col gap-6">
      <button className = "py-2 px-4 cursor-pointer text-gray-700 font-black" onClick={handleCreateAchievement}>Create Achievement</button>
      <button className = "py-2 px-4 cursor-pointer text-gray-700 font-black" onClick={handleCreatePlayerStats}>Create Player Stats</button>
      <button className = "py-2 px-4 cursor-pointer text-gray-700 font-black" onClick={handleUpdatePlayerStats}>Update Player Stats</button>
      <button className = "py-2 px-4 cursor-pointer text-gray-700 font-black" onClick={handleCreateMatch}>Create Match</button>
      <button className = "py-2 px-4 cursor-pointer text-gray-700 font-black" onClick={handleUpdateAchievement}>Upsert Achievement</button>
    </div>
  );
}
