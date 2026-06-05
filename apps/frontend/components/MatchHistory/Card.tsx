// MatchCard.tsx
// A single match card extracted from MatchHistory.
// Drop this file next to MatchHistory.tsx and import it there.

// import { MatchMember } from "@/app/(site)/profile/[userId]/page";

export type MatchMember = {
  id: string;
  matchId: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  isWinner: boolean;
  kills: number;
  deaths: number;
  player: {
	id: string;
	userId: string;
	xp: number;
	level: number;
	wins: number;
	losses: number;
	kills: number;
	deaths: number;
	damageDealt: number;
	damageTaken: number;
	createdAt: string;
	updatedAt: string;
  };
};
// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchCardParticipant = {
	userId: string;
	displayName?: string | null;
	avatarUrl?: string | null;
	isWinner?: boolean;
	kills: number;
	deaths: number;
};

export type MatchCardItem = {
	id: string;
	status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
	duration?: number | null;
	createdAt: string;
	endedAt?: string | null;
	mode?: string | null;
	mapName?: string | null;
	score?: string | null;
	summary?: string | null;
	player: MatchCardParticipant;
	participants?: MatchCardParticipant[];
};

export type MatchCardProps = {
	/** The match data to display */
	match: MatchCardItem;
	/** The logged-in user's ID — used to label "You" and highlight the current player */
	currentUserId?: string;
	/** Optional extra Tailwind classes on the root <article> */
	className?: string;
	members: MatchMember[];
};

// ─── Lookup table ─────────────────────────────────────────────────────────────

const statusMeta: Record<'win' | 'loss' | 'draw' | 'pending',
	{ label: string; chip: string; accent: string }
> = {
	win: {
		label: 'Victory',
		chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		accent: 'from-emerald-50 via-white to-white',
	},
	loss: {
		label: 'Defeat',
		chip: 'bg-rose-100 text-rose-700 border-rose-200',
		accent: 'from-rose-50 via-white to-white',
	},
	draw: {
		label: 'Draw',
		chip: 'bg-amber-100 text-amber-700 border-amber-200',
		accent: 'from-amber-50 via-white to-white',
	},
	pending: {
		label: 'Pending',
		chip: 'bg-zinc-100 text-zinc-600 border-zinc-200',
		accent: 'from-zinc-50 via-white to-white',
	},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string | null): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

function formatDuration(duration?: number | null): string {
	if (!duration && duration !== 0) return '—';
	if (duration < 60) return `${duration}m`;
	const hours = Math.floor(duration / 60);
	const minutes = duration % 60;
	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getMatchOutcome(match: MatchCardItem): 'win' | 'loss' | 'draw' | 'pending' {
	if (match.status !== 'FINISHED') return 'pending';

	if (typeof match.player?.isWinner === 'boolean') {
		return match.player.isWinner ? 'win' : 'loss';
	}

	if (match.score && /^\s*(\d+)\s*[-:]\s*(\d+)\s*$/.test(match.score)) {
		const [, left, right] = match.score.match(/^\s*(\d+)\s*[-:]\s*(\d+)\s*$/) ?? [];
		if (left && right) {
			const l = Number(left);
			const r = Number(right);
			if (l === r) return 'draw';
			return l > r ? 'win' : 'loss';
		}
	}

	return 'loss';
}

function getDisplayName(participant: MatchCardParticipant, currentUserId?: string): string {
	if (participant.userId === currentUserId) return 'You';
	return participant.displayName?.trim() || participant.userId.slice(0, 8);
}

// ─── ParticipantAvatar ────────────────────────────────────────────────────────

function ParticipantAvatar({
	participant,
	currentUserId,
}: {
	participant: MatchCardParticipant;
	currentUserId?: string;
}) {
	const label = getDisplayName(participant, currentUserId);
	const fallback = label
		.split(' ')
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	return (
		<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-black uppercase text-zinc-600">
			{participant.avatarUrl ? (
				<img src={participant.avatarUrl} alt={`${label} avatar`} className="h-full w-full object-cover" />
			) : (
				fallback || 'W'
			)}
		</div>
	);
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

export function MatchCard({ match, currentUserId, className = '', members }
	: MatchCardProps) {
	const outcome = getMatchOutcome(match);
	const meta = statusMeta[outcome];

	const participants = match.participants?.length ? match.participants : [match.player];
	const visibleParticipants = participants.slice(0, 4);

	return (
		<article
			className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-br ${meta.accent} p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
		>
			<div className="relative flex flex-col gap-4">
				{/* Header: mode + outcome chip / map name */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-sm font-black text-zinc-900">{match.mode ?? 'Match'}</p>
							<span
								className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${meta.chip}`}
							>
								{meta.label}
							</span>
						</div>
					</div>
					<div className="flex flex-col items-start gap-1 sm:items-end">
						<p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
							{match.mapName ?? 'Unknown map'}
						</p>
					</div>
				</div>

				{/* Stats grid */}
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Played</p>
						<p className="text-xs font-black text-zinc-900">
							{formatDate(match.endedAt ?? match.createdAt)}
						</p>
					</div>
					<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Duration</p>
						<p className="text-sm font-black text-zinc-900">{formatDuration(match.duration)}</p>
					</div>
					<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Result</p>
						<p className="text-sm font-black text-zinc-900">
							{outcome === 'pending' ? 'Pending' : meta.label}
						</p>
					</div>
					<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Status</p>
						<p className="text-sm font-black text-zinc-900">{match.status}</p>
					</div>
				</div>

				{/* Kill/death pills */}
				<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
						{match.player.kills} Kills
					</span>
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
						{match.player.deaths} Deaths
					</span>
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
						{participants.length} Players
					</span>
					{match.player.userId === currentUserId && (
						<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
							You
						</span>
					)}
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
						{match.score ?? '—'}
					</span>
				</div>

				{/* Participants list */}
				<div className="rounded-2xl border border-zinc-200 bg-white/80 p-3">
					<div className="mb-2 flex items-center justify-between gap-3">
						<p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
							Participants
						</p>
						<p className="text-[10px] font-medium text-zinc-500">
							{outcome === 'win'
								? 'Victory secured'
								: outcome === 'loss'
								? 'Needs rematch'
								: outcome === 'draw'
								? 'Even fight'
								: 'Waiting for result'}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						{/* participants: */}
						{members.map((participant) => {
							const isCurrentUser =
								participant.userId === currentUserId ||
								participant.userId === match.player.userId;
							const isWinner = Boolean(participant.isWinner);
							const participantClass = isWinner
								? 'bg-emerald-50 text-emerald-700 border-emerald-200'
								: isCurrentUser
								? 'bg-blue-50 text-blue-700 border-blue-200'
								: 'bg-zinc-50 text-zinc-700 border-zinc-200';

							return (
								<div
									key={`${match.id}-${participant.userId}`}
									className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm min-w-0 overflow-hidden ${participantClass}`}
								>
									<ParticipantAvatar participant={participant} currentUserId={currentUserId} />
									<div className="min-w-0 flex-1">
										<p className="truncate font-bold">
											{getDisplayName(participant, currentUserId)}
										</p>
										<p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
											{participant.isWinner ? 'Winner' : 'Competitor'}
										</p>
									</div>

									<div className="flex shrink-0 items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
										<span>{participant.kills} K</span>
										<span>{participant.deaths} D</span>

									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</article>
	);
}

export default MatchCard;