import { useEffect, useState } from '@wordpress/element';
import type { LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../lib/api';

export default function Leaderboard() {
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchLeaderboard()
			.then(setEntries)
			.catch((err: Error) => setError(err.message));
	}, []);

	if (error) {
		return <p className="text-sm text-muted">Couldn't load the leaderboard right now.</p>;
	}

	if (!entries) {
		return <p className="text-sm text-muted">Loading leaderboard…</p>;
	}

	if (entries.length === 0) {
		return <p className="text-sm text-muted">No games played yet — be the first!</p>;
	}

	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="text-left text-muted">
					<th className="py-1 pr-2">#</th>
					<th className="py-1 pr-2">Player</th>
					<th className="py-1 pr-2">Wins</th>
					<th className="py-1 pr-2">Win %</th>
					<th className="py-1 pr-2">Avg guesses</th>
				</tr>
			</thead>

			<tbody>
				{
					entries.map((entry, idx) => (
						<tr key={`${entry.display_name}-${idx}`} className="border-t border-border">
							<td className="py-1.5 pr-2">{idx + 1}</td>
							<td className="py-1.5 pr-2">
								{entry.display_name}
								{entry.is_member && <span className="ml-1 text-xs text-muted">(member)</span>}
							</td>
							<td className="py-1.5 pr-2">{entry.wins}</td>
							<td className="py-1.5 pr-2">{entry.win_rate}%</td>
							<td className="py-1.5 pr-2">{entry.avg_guesses ?? '—'}</td>
						</tr>
					))
				}
			</tbody>
		</table>
	);
}
