import { useEffect, useState } from '@wordpress/element';
import { Spinner, Notice } from '@wordpress/components';
import type { StatsResponse } from '../types';
import { getStats } from '../lib/api';

export default function StatsPanel() {
	const [stats, setStats] = useState<StatsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getStats()
			.then(setStats)
			.catch((err: Error) => setError(err.message));
	}, []);

	if (error) {
		return <Notice status="error" isDismissible={false}>{error}</Notice>;
	}

	if (!stats) {
		return <Spinner />;
	}

	return (
		<div className="wordsprint-stats">
			<div className="wordsprint-stats__cards">
				<div className="wordsprint-stats__card">
					<span className="wordsprint-stats__value">{stats.games_played}</span>
					<span className="wordsprint-stats__label">Games played</span>
				</div>

				<div className="wordsprint-stats__card">
					<span className="wordsprint-stats__value">{stats.wins}</span>
					<span className="wordsprint-stats__label">Wins</span>
				</div>

				<div className="wordsprint-stats__card">
					<span className="wordsprint-stats__value">{stats.win_rate}%</span>
					<span className="wordsprint-stats__label">Win rate</span>
				</div>

				<div className="wordsprint-stats__card">
					<span className="wordsprint-stats__value">{stats.avg_guesses ?? '—'}</span>
					<span className="wordsprint-stats__label">Avg guesses (wins)</span>
				</div>
			</div>

			<h2>Most-missed words</h2>
			{
				stats.most_missed.length === 0 ? (
					<p>Not enough data yet.</p>
				) : (
					<table className="widefat striped">
						<thead>
							<tr>
								<th>Word</th>
								<th>Times played</th>
								<th>Times won</th>
								<th>Win rate</th>
							</tr>
						</thead>
						
						<tbody>
							{
								stats.most_missed.map((row) => (
									<tr key={row.word}>
										<td><code>{row.word}</code></td>
										<td>{row.times_played}</td>
										<td>{row.times_won}</td>
										<td>{row.win_rate}%</td>
									</tr>
								))
							}
						</tbody>
					</table>
				)
			}
		</div>
	);
}
