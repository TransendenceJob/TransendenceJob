"use client";


import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditProfileModal from "@/components/EditProfile";
import { useAuth } from "@/components/Providers";
import { authClient } from "@/src/core/api/auth/auth.client";
import { getAvatarsForMatchMembers, getMyProfile } from "@/src/core/api/profile/profile.client";
import { Pencil } from "lucide-react";
import { Achievements } from "@/components/Achievements";
import MatchHistory from "@/components/MatchHistory";
import { FaCrown, FaMedal, FaTrophy } from "react-icons/fa";
import type { MatchMember } from "@/components/MatchHistory/Card";
import type { MatchMemberAvatar } from "@/src/types/profileTypes";

type TabType = 'Info' | 'Friends' | 'Clan' | 'Invitations' | 'Achievements' | 'Match History';

type MatchHistoryParticipant = {
    userId: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    isWinner?: boolean;
    kills: number;
    deaths: number;
};

type MatchHistoryEntry = {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
    duration?: number | null;
    createdAt: string;
    endedAt?: string | null;
    mode?: string | null;
    mapName?: string | null;
    score?: string | null;
    summary?: string | null;
    player: MatchHistoryParticipant;
    participants?: MatchHistoryParticipant[];
};

type PlayerStats = {
    level?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
        matchHistory?: MatchHistoryEntry[];
    achievements?: Array<string | {
		id?: string;
		type?: string;
		name?: string;
		description?: string;
		icon?: string;
		xpReward?: number;
		points?: number;
		progress?: number;
		progressTarget?: number;
		achieved?: boolean;
		achievedAt?: string;
		meta?: Record<string, any>;
		}>;
};

type SocialProfile = {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";


export default function ProfilePage() {
    // Log when component mounts (after first render)

    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('Info');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [profileReloadKey, setProfileReloadKey] = useState(0);
    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
    const [friends, setFriends] = useState<unknown[]>([]);
    const [clans, setClans] = useState<unknown[]>([]);
    const [invites, setInvites] = useState<unknown[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);
    const [members, setMembers] = useState<MatchMember[]>([]);

    // Compute displayName, avatarUrl, bio early so useEffect can access them
    const displayName = profile?.displayName || user?.displayName || user?.username || user?.email || "Unknown User";
    const avatarUrl = profile?.avatarUrl;
    const bio = profile?.bio;
    const level = stats?.level ?? 1;

    const safeJson = async (r: Response | null) => {
        if (r && r.ok) {
            const json = await r.json();
            return Array.isArray(json) ? json : [];
        }
        return [];
    };

    const safeObject = async <T,>(r: Response | null): Promise<T | null> => {
        if (r && r.ok) {
            return (await r.json()) as T;
        }
        return null;
    };
    // Define it at component level
	const loadProfileData = useCallback(async () => {
		setIsLoadingData(true);
		try {
			const socialProfile = await getMyProfile();
			if (socialProfile.ok) setProfile(socialProfile.data);
			const me = await authClient.getMe();
            if (!me.ok) {
                setDataError(typeof me.error === "string" ? me.error : "Unable to load current user.");
                return;
            }
            const resolvedUser = me.data.user;
			const token = sessionStorage.getItem("auth.accessToken");
			const headers: HeadersInit = {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			};

            const [friendsRes, clansRes, invitesRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/friends`, { headers }),
                fetch(`${API_BASE}/clans/me`, { headers }),
                fetch(`${API_BASE}/clans/me/invites`, { headers }),
                resolvedUser?.id ? fetch(`${API_BASE}/stats/user/${resolvedUser.id}`, { headers }) : Promise.resolve(null),
				// add 
				
            ]);

			

            setFriends(await safeJson(friendsRes));
            setClans(await safeJson(clansRes));
            setInvites(await safeJson(invitesRes));

            const statsObj = await safeObject<PlayerStats>(statsRes);

            if (statsObj) {
                setStats(statsObj);

                // Normalize match entries into the shape MatchHistory component expects
                const rawMatches = Array.isArray((statsObj as any).matchHistory) ? (statsObj as any).matchHistory : [];

                const matchIds = rawMatches
                    .map((entry: any) => (entry.match ?? entry)?.id)
                    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

                if (matchIds.length > 0) {
                    const results = await Promise.all(matchIds.map((id: string) => getAvatarsForMatchMembers(id)));

                    const allMembers = results.flatMap((result, index) => {
                        if (!result.ok) {
                            return [];
                        }

                        const matchId = matchIds[index];
                        const sourceMatch = rawMatches[index] ?? {};
                        const rawParticipants = ((sourceMatch.match ?? sourceMatch).matchParticipants ?? []) as Array<{
                            userId: string;
                            isWinner?: boolean;
                            kills?: number;
                            deaths?: number;
                            player?: MatchMember["player"];
                        }>;

                        const participantsByUserId = new Map(
                            rawParticipants.map((participant) => [participant.userId, participant]),
                        );

                        return result.data.map((avatar: MatchMemberAvatar) => {
                            const sourceParticipant = participantsByUserId.get(avatar.userId);

                            return {
                                id: `${matchId}:${avatar.userId}`,
                                matchId,
                                userId: avatar.userId,
                                displayName: avatar.displayName,
                                avatarUrl: avatar.avatarUrl,
                                isWinner: sourceParticipant?.isWinner ?? false,
                                kills: sourceParticipant?.kills ?? 0,
                                deaths: sourceParticipant?.deaths ?? 0,
                                player: sourceParticipant?.player ?? {
                                    id: `${matchId}:${avatar.userId}:player`,
                                    userId: avatar.userId,
                                    xp: 0,
                                    level: 0,
                                    wins: 0,
                                    losses: 0,
                                    kills: sourceParticipant?.kills ?? 0,
                                    deaths: sourceParticipant?.deaths ?? 0,
                                    damageDealt: 0,
                                    damageTaken: 0,
                                    createdAt: new Date(0).toISOString(),
                                    updatedAt: new Date(0).toISOString(),
                                },
                            } satisfies MatchMember;
                        });
                    });

                    setMembers(allMembers);
                } else {
                    setMembers([]);
                }


                
                const normalized = rawMatches.map((entry: any) => {
                    const match = entry.match ?? entry;
                    const rawParticipants = match.matchParticipants ?? [];
                    const participants: MatchHistoryParticipant[] = rawParticipants.map((p: any) => ({
                        userId: p.userId,
                        displayName: p.displayName ?? null,
                        avatarUrl: p.avatarUrl ?? null,
                        isWinner: p.isWinner ?? false,
                        kills: p.kills ?? 0,
                        deaths: p.deaths ?? 0,
                    }));

                    // The /stats/user/:id response stores current user's stats on the entry root.
                    const entryRootSnapshot = {
                        userId: entry.userId,
                        displayName: entry.displayName,
                        avatarUrl: entry.avatarUrl,
                        isWinner: entry.isWinner,
                        kills: entry.kills,
                        deaths: entry.deaths,
                    };

                    let playerSnapshot: any = null;
                    if (entryRootSnapshot.userId) {
                        playerSnapshot = entryRootSnapshot;
                    } else if ((entry as any).player) {
                        playerSnapshot = (entry as any).player;
                    } else {
                        playerSnapshot = participants.find((p) => p.userId === resolvedUser?.id) ?? participants[0] ?? null;
                    }

                    const player: MatchHistoryParticipant = playerSnapshot
                        ? {
                              userId: playerSnapshot.userId ?? resolvedUser?.id ?? 'unknown',
                              displayName: playerSnapshot.displayName ?? (playerSnapshot.userId === resolvedUser?.id ? 'You' : null),
                              avatarUrl: playerSnapshot.avatarUrl ?? null,
                              isWinner: playerSnapshot.isWinner ?? false,
                              kills: playerSnapshot.kills ?? 0,
                              deaths: playerSnapshot.deaths ?? 0,
                          }
                        : {
                              userId: resolvedUser?.id ?? 'unknown',
                              displayName: 'You',
                              avatarUrl: null,
                              isWinner: false,
                              kills: 0,
                              deaths: 0,
                          };

                    const mergedParticipants = participants.length
                        ? participants
                        : playerSnapshot
                        ? [
                              {
                                  userId: playerSnapshot.userId ?? resolvedUser?.id ?? 'unknown',
                                  displayName: playerSnapshot.displayName ?? null,
                                  avatarUrl: playerSnapshot.avatarUrl ?? null, // 
                                  isWinner: playerSnapshot.isWinner ?? false,
                                  kills: playerSnapshot.kills ?? 0,
                                  deaths: playerSnapshot.deaths ?? 0,
                              },
                          ]
                        : [];

                    return {
                        id: match.id,
                        status: match.status,
                        duration: match.duration ?? null,
                        createdAt: match.createdAt,
                        endedAt: match.endedAt ?? null,
                        mode: match.mode ?? null,
                        mapName: match.mapName ?? null,
                        score: match.score ?? null,
                        summary: match.summary ?? null,
                        player,
                        participants: mergedParticipants,
                    } as MatchHistoryEntry;
                });

                setMatchHistory(normalized);
            } else {
                setStats(null);
                setMatchHistory([]);
            }
		} finally {
			setIsLoadingData(false);
		}
	}, []); // add any real deps if needed


	//resolvedUser?.id ? fetch(`${API_BASE}/stats/user/${resolvedUser.id}`, { headers }) : Promise.resolve(null),
	// here can be added the list avatarUrl = stats?.matchHistory.map((obj.id)=>{fetch(`${API_BASE}/stats/user/${resolvedUser.id}`, { headers }) : Promise.resolve(null)}) ? 
	// ✅ Now useEffect just calls it
	useEffect(() => {
		void loadProfileData();
	}, [loadProfileData]);


    const computedStats = useMemo(() => {
        const wins = stats?.wins ?? 0;
        const losses = stats?.losses ?? 0;
        const kills = stats?.kills ?? 0;
        const deaths = stats?.deaths ?? 0;
        const matches = wins + losses;
        const winRate = matches > 0 ? `${Math.round((wins / matches) * 100)}%` : "0%";
        const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00";

        return {
            matches,
            winRate,
            kd,
            kills,
            deaths,
            wins,
        };
    }, [stats]);

    const achievementCount = stats?.achievements?.length ?? 0;

    const tabs: { name: TabType; icon: string }[] = [
        {name: 'Info', icon: '👤'},
        {name: 'Friends', icon: '👥'},
        {name: 'Clan', icon: '🛡️'},
        {name: 'Invitations', icon: '✉️'},
        {name: 'Achievements', icon: '🏆'},
        {name: 'Match History', icon: '📜'},
    ];

    return (
        <ProtectedRoute>
        <EditProfileModal
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSaved={async () => {
                // reload profile and related data after save
                await loadProfileData();
            }}
            setProfile={setProfile}
            displayName={displayName}
            bio={bio ?? ""}
            email={user?.email ?? ""}
        />
        <div className="max-w-4xl mx-auto py-12 px-6">
            {dataError && (
                <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {dataError}
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    {label: "Matches", value: computedStats.matches.toString(), color: "text-blue-500"},
                    {label: "Win Rate", value: computedStats.winRate, color: "text-green-500"},
                    {label: "K/D Ratio", value: computedStats.kd, color: "text-red-500"},
                    {label: "Kills", value: computedStats.kills.toString(), color: "text-green-500"},
                    {label: "Deaths", value: computedStats.deaths.toString(), color: "text-red-500"},
                ].map((stat) => (
                    <div key={stat.label}
                         className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border border-foreground/5">
                        <p className="text-[10px] uppercase font-bold text-zinc-500">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-8 md:flex-row ">

                {/* LEFT: Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2 md:h-full md:self-stretch">
                    <div className="relative p-6 mb-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-center">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(true)}
                            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                        >
                            <Pencil size={14} />
                            {/*Edit profile*/}
                        </button>
                        <div
                            className=" w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-4 border-white dark:border-zinc-800 shadow-lg">
							{avatarUrl ? (
                                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                "🪱"
                            )}
                        </div>

                        <h2 className="font-black text-l">{displayName}</h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase">Level {level} Recruit</p>
                    </div>

                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                                activeTab === tab.name
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                    : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* RIGHT: Content Display Area */}
                <div
                    className="flex-1 bg-white dark:bg-zinc-900 border border-foreground/5 rounded-3xl p-8 shadow-sm flex min-h-0 flex-col md:h-full md:self-stretch"
                >
                    <h3 className="text-2xl font-black mb-6 border-b pb-4 border-foreground/5">
                        {activeTab}
                    </h3>
{/* hhhhhhh */}
                    <div className="min-h-0 flex-1 space-y-4 pr-1 overflow-hidden">

                        {activeTab === 'Info' && (
                            <div className="grid gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Email
                                        Address</label>
                                    <p className="font-medium">{user?.email ?? "N/A"}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Total
                                        Victories</label>
                                    <p className="font-medium">{computedStats.wins} Matches Won</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Bio</label>
                                    <p className="font-medium whitespace-pre-wrap">
                                        {bio?.trim() ? bio : "Recruit exploring the arena."}
                                    </p>
                                </div>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {[
                                        {
                                            label: "Rank",
                                            value: `Lv ${level}`,
                                            icon: <FaCrown className="text-amber-500" />,
                                        },
                                        {
                                            label: "Wins",
                                            value: String(computedStats.wins),
                                            icon: <FaTrophy className="text-yellow-500" />,
                                        },
                                        {
                                            label: "Rewards",
                                            value: String(achievementCount),
                                            icon: <FaMedal className="text-emerald-500" />,
                                        },
                                    ].map((item: { label: string; value: string; icon: ReactNode }) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/40"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                                    {item.label}
                                                </p>
                                                <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-50">
                                                    {item.value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Friends' && (
                            <div className="space-y-3">
                                {friends.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 italic">
                                        You haven't added any battle buddies yet.
                                    </div>
                                ) : (
                                    friends.slice(0, 10).map((friend: unknown, index: number) => (
                                        <div key={index} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                                            {typeof friend === "object" && friend !== null
                                                ? (friend as { displayName?: string; userId?: string }).displayName
                                                    || (friend as { userId?: string }).userId
                                                    || "Friend"
                                                : String(friend)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'Clan' && (
                            clans.length === 0 ? (
                                <div
                                    className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                                    <p className="text-zinc-500">You are not currently in a Clan.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {clans.slice(0, 5).map((clan: unknown, index: number) => (
                                        <div key={index} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                                            {typeof clan === "object" && clan !== null
                                                ? (clan as { name?: string; id?: string }).name || (clan as { id?: string }).id || "Clan"
                                                : String(clan)}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === 'Invitations' && (
                            <div className="space-y-3">
                                {invites.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 italic">
                                        No pending invitations.
                                    </div>
                                ) : (
                                    invites.slice(0, 10).map((invite: unknown, index: number) => (
                                        <div
                                            key={index}
                                            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-sm"
                                        >
                                            {typeof invite === "object" && invite !== null
                                                ? (invite as { id?: string; clanId?: string }).id
                                                    || (invite as { clanId?: string }).clanId
                                                    || "Invitation"
                                                : String(invite)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {activeTab === 'Achievements' && (
                            <Achievements
                                achievements={stats?.achievements ?? []}
                                emptyTitle="No relics yet."
                                emptyDescription="Complete quests, win matches, and forge your legend."
                            />
                        )}
                        {activeTab === 'Match History' && (
                            <MatchHistory
								members= {members}
                                matches={matchHistory}
                                currentUserId={user?.id ?? undefined}
                                emptyTitle="No battles recorded yet."
                                emptyDescription="Your past matches will appear here once the stats pipeline is connected."
                            />
                        )}
                    </div>
                </div>
            </div>
            {isLoadingData && (
                <p className="text-sm text-zinc-500 mt-4">Loading profile data...</p>
            )}
        </div>
        </ProtectedRoute>
    );
}
