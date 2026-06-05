import type { MatchCardItem, MatchMember } from './MatchHistory/Card';
import MatchCard from './MatchHistory/Card';

// Re-export the item type under the original name so existing imports don't break
export type MatchHistoryItem = MatchCardItem;

export type MatchHistoryProps = {
	members: MatchMember[];
	matches?: MatchHistoryItem[];
	currentUserId?: string;
	className?: string;
	emptyTitle?: string;
	emptyDescription?: string;
};

// ─── Helpers (only what MatchHistory itself needs) ────────────────────────────

function getMatchOutcome(match: MatchHistoryItem): 'win' | 'loss' | 'draw' | 'pending' {
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

// ─── MatchHistory ─────────────────────────────────────────────────────────────

export function MatchHistory({
	members = [],
	matches = [],
	currentUserId,
	className = '',
	emptyTitle = 'No matches yet.',
	emptyDescription = 'Once a match is recorded in the stats service, it will appear here.',
}: MatchHistoryProps) {
	// Derived stats — computed from the matches array, not stored in state
	const totalMatches = matches.length;
	const wins = matches.filter((m) => getMatchOutcome(m) === 'win').length;
	const losses = matches.filter((m) => getMatchOutcome(m) === 'loss').length;
	const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
	return (
		<div
			className={`mt-2 flex h-auto min-h-0 flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
		>
			{/* Header */}
			<div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">
						Match History
					</h4>
					<p className="mt-1 text-xs text-zinc-500">
						Recent battles, outcomes, and performance snapshots.
					</p>
				</div>
				<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{totalMatches} Total
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{wins} Wins
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{losses} Losses
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{winRate}% Win Rate
					</span>
				</div>
			</div>

			{/* Empty state */}
			{matches.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
					<div className="text-base font-bold text-zinc-800">{emptyTitle}</div>
					<p className="mt-2 text-sm text-zinc-500">{emptyDescription}</p>
				</div>
			) : (
				// Scrollable card list
				<div className="overflow-y-auto pr-2 max-h-[380px]">
					<div className="flex flex-col gap-4">
						{matches.map((match) => (
							// MatchHistory only passes down what MatchCard needs
							<MatchCard
								key={match.id}
								match={match}
								currentUserId={currentUserId}
								members = {members}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default MatchHistory;