import { useEffect, useState } from '@wordpress/element';
import { Spinner, Notice } from '@wordpress/components';
import type { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../lib/api';

export default function LeaderboardPanel() {
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getLeaderboard()
			.then(setEntries)
			.catch((err: Error) => setError(err.message));
	}, []);

	if (error) {
		return <Notice status="error" isDismissible={false}>{error}</Notice>;
	}

	if (!entries) {
		return <Spinner />;
	}

	if (entries.length === 0) {
		return <p>No games played yet.</p>;
	}

	return (
		<table className="widefat striped">
			<thead>
				<tr>
					<th>#</th>
					<th>Player</th>
					<th>Type</th>
					<th>Games played</th>
					<th>Wins</th>
					<th>Win rate</th>
					<th>Avg guesses</th>
					<th>Last played</th>
				</tr>
			</thead>

			<tbody>
				{
					entries.map((entry, idx) => (
						<tr key={`${entry.display_name}-${idx}`}>
							<td>{idx + 1}</td>
							<td>{entry.display_name}</td>
							<td>{entry.is_member ? 'Member' : 'Guest'}</td>
							<td>{entry.games_played}</td>
							<td>{entry.wins}</td>
							<td>{entry.win_rate}%</td>
							<td>{entry.avg_guesses ?? '—'}</td>
							<td>{new Date(entry.last_played).toLocaleString()}</td>
						</tr>
					))
				}
			</tbody>
		</table>
	);
}
