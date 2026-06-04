type AchievementInput =
    | string
    | {
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
          achievedAt?: string | null;
          meta?: Record<string, unknown>;
      };

type AchievementCard = {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    achieved: boolean;
    progressValue: number | null;
    progressTarget: number | null;
    xpReward: number | null;
    points: number | null;
    achievedAt: string | null;
    accent: string;
    ring: string;
    badgeLabel: string;
};

type AchievementsProps = {
    achievements?: AchievementInput[];
    className?: string;
    emptyTitle?: string;
    emptyDescription?: string;
};

export function Achievements({
    achievements = [],
    className = "",
    emptyTitle = "No achievements yet.",
    emptyDescription = "Your legend starts here.",
}: AchievementsProps) {
    const achievementCards: AchievementCard[] = achievements.map((achievement, index) => {
        if (typeof achievement === "string") {
            return {
                id: `ach-${index}-${achievement}`,
                title: achievement.replace(/_/g, " "),
                subtitle: "Unlocked achievement",
                icon: "🏆",
                achieved: true,
                progressValue: null,
                progressTarget: null,
                xpReward: null,
                points: null,
                achievedAt: null,
                accent: "from-amber-500/20 via-yellow-500/10 to-amber-400/5",
                ring: "ring-amber-400/30",
                badgeLabel: "Completed",
            };
        }


        const achieved = achievement.achieved ?? false;
        const progressTarget = achievement.progressTarget ?? null;
        const progressValue = achievement.progress ?? null;
        const xpReward = achievement.xpReward ?? null;
        const points = achievement.points ?? null;
        const achievedAt = achievement.achievedAt ?? null;

        return {
            id: achievement.id ?? `ach-${index}`,
            title: achievement.name ?? achievement.type ?? "Achievement",
            subtitle: achievement.description ?? (achieved ? "Completed" : "In progress"),
            icon: achievement.icon ?? (achieved ? "✨" : "🔒"),
            achieved,
            progressValue,
            progressTarget,
            xpReward,
            points,
            achievedAt,
            accent: achieved
                ? "from-emerald-50 via-yellow-50 to-white"
                : "from-white via-zinc-50 to-white",
            ring: achieved ? "ring-emerald-200/80" : "ring-zinc-200",
            badgeLabel: achieved ? "Completed" : "Quest",
        };
    });

    const completedCount = achievementCards.filter((achievement) => achievement.achieved).length;
    const totalCount = achievementCards.length;
    const pendingCount = totalCount - completedCount;

    // console.log("ACIEVEMENTS: ", achievements)
    const cardGridClassName =
        achievementCards.length === 0
            ? "grid-cols-1"
            : achievementCards.length === 1
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

    const formatDate = (value: string | null) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    };

    return (
        <div className={`mt-2 flex min-h-0 flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`} >
            <div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between ">
                <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Achievements</h4>
                    <p className="mt-1 text-xs text-zinc-500">Progress, rewards, and completed feats.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                        {completedCount} Cleared
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                        {pendingCount} Pending
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                        {totalCount} Total
                    </span>
                </div>
            </div>

            {achievementCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 ">
                    <div className="text-base font-bold text-zinc-800">{emptyTitle}</div>
                    <p className="mt-2 text-sm text-zinc-500">{emptyDescription}</p>
                </div>
            ) : (
                <div className="overflow-y-auto pr-2 max-h-[380px] ">
                    <div className="flex flex-col gap-5">
                        {achievementCards
                        .sort((a, b) => {
                            const aTime = a.achievedAt ? new Date(a.achievedAt).getTime() : 0;
                            const bTime = b.achievedAt ? new Date(b.achievedAt).getTime() : 0;
                            return bTime - aTime;
                        })
                        .slice(0, 5)
                        .map((badge) => {
                        const progressPercent =
                            badge.progressTarget && badge.progressTarget > 0 && badge.progressValue !== null
                                ? Math.min(100, Math.max(0, (badge.progressValue / badge.progressTarget) * 100))
                                : null;
                        const achievedDate = formatDate(badge.achievedAt);

                        return (
                            <div
                                key={badge.id}
                                className={`relative w-full overflow-hidden rounded-2xl border bg-linear-to-br ${badge.accent} p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${badge.ring}`}
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_42%)] opacity-80" />
                                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                                    {/*<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-lg shadow-sm">
                                    </div>*/}

                                    <div className="min-w-0 flex-1 space-y-3">
                                        {badge.icon}
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <h5 className="truncate text-sm font-extrabold text-zinc-900">{badge.title}</h5>
                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">{badge.subtitle}</p>
                                            </div>
                                            <span
                                                className={`self-start rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] ${
                                                    badge.achieved
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-zinc-100 text-zinc-600"
                                                }`}
                                            >
                                                {badge.badgeLabel}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">XP</p>
                                                <p className="text-sm font-black text-zinc-900">{badge.xpReward ?? "—"}</p>
                                            </div>
                                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Points</p>
                                                <p className="text-sm font-black text-zinc-900">{badge.points ?? "—"}</p>
                                            </div>
                                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Progress</p>
                                                <p className="text-sm font-black text-zinc-900">
                                                    {progressPercent !== null ? `${badge.progressValue}/${badge.progressTarget}` : "—"}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Status</p>
                                                <p className="text-sm font-black text-zinc-900">{badge.achieved ? "Done" : "Quest"}</p>
                                            </div>
                                        </div>

                                        {progressPercent !== null && (
                                            <div>
                                                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                                                    <span>Progress</span>
                                                    <span>{Math.round(progressPercent)}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            badge.achieved
                                                                ? "bg-linear-to-r from-blue-500 to-emerald-400"
                                                                : "bg-linear-to-r from-zinc-400 to-zinc-300"
                                                        }`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {achievedDate && (
                                            <p className="text-[11px] font-medium text-zinc-500">
                                                Achieved {achievedDate}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Achievements;
