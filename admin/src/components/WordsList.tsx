import { useEffect, useState } from '@wordpress/element';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, TextControl, ToggleControl, Spinner, Notice } from '@wordpress/components';
import type { WordRow } from '../types';
import { listWords, createWord, updateWord, deleteWord } from '../lib/api';

// Helpers

function buildExportUrl(params: {
	format: 'csv' | 'txt';
	filter?: 'all' | 'active' | 'inactive';
	ids?: number[];
}): string {
	const config = (window as Window & typeof globalThis & {
		wordsprintAdminConfig: { root: string; nonce: string };
	}).wordsprintAdminConfig;

	const root = config.root.replace(/\/$/, '');
	const url = new URL(`${root}/wordsprint/v1/admin/words/export`);

	url.searchParams.set('format', params.format);
	url.searchParams.set('_wpnonce', config.nonce);

	if (params.ids && params.ids.length > 0) {
		url.searchParams.set('ids', params.ids.join(','));
	} else if (params.filter) {
		url.searchParams.set('filter', params.filter);
	}

	return url.toString();
}

function triggerDownload(href: string) {
	const a = document.createElement('a');
	a.href = href;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

/** Call DELETE /admin/words/bulk with a list of IDs */
async function bulkDeleteWords(ids: number[]): Promise<{ deleted_count: number }> {
	const config = (window as Window & typeof globalThis & {
		wordsprintAdminConfig: { root: string; nonce: string };
	}).wordsprintAdminConfig;

	const root = config.root.replace(/\/$/, '');
	const res = await fetch(`${root}/wordsprint/v1/admin/words/bulk-delete`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': config.nonce,
		},
		body: JSON.stringify({ ids }),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data?.message ?? 'Bulk delete failed.');
	return data as { deleted_count: number };
}

// Component

export default function WordsList() {
	// --- List state ---
	const [words, setWords] = useState<WordRow[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// --- Add word state ---
	const [newWord, setNewWord] = useState('');
	const [addError, setAddError] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);

	// --- Inline edit state ---
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editValue, setEditValue] = useState('');

	// --- Selection state ---
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// --- Export state (persisted to localStorage) ---
	const [exportFormat, setExportFormatState] = useState<'csv' | 'txt'>(() => {
		try {
			const stored = localStorage.getItem('wordsprint-export-format');
			return stored === 'txt' ? 'txt' : 'csv';
		} catch { return 'csv'; }
	});
	const [exportMenuOpen, setExportMenuOpen] = useState(false);

	const setExportFormat = (fmt: 'csv' | 'txt') => {
		setExportFormatState(fmt);
		try { localStorage.setItem('wordsprint-export-format', fmt); } catch { /* ignore */ }
	};

	// --- Bulk delete state ---
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [bulkNotice, setBulkNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

	// Data loading

	const load = (targetPage = page, targetSearch = search) => {
		setLoading(true);
		setError(null);

		listWords({ page: targetPage, search: targetSearch, per_page: 20 })
			.then((res) => {
				setWords(res.words);
				setTotalPages(res.total_pages);
				setSelectedIds((prev) => {
					const visibleIds = new Set(res.words.map((w) => w.id));
					const next = new Set<number>();
					prev.forEach((id) => { if (visibleIds.has(id)) next.add(id); });
					return next;
				});
			})
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false));
	};

	useEffect(() => { load(1, search); setPage(1); }, [search]);
	useEffect(() => { load(page, search); }, [page]);

	// Add word

	const handleAdd = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setAddError(null);

		const trimmed = newWord.trim().toLowerCase();
		if (!trimmed) return;

		setAdding(true);
		createWord(trimmed)
			.then(() => { setNewWord(''); load(1, search); setPage(1); })
			.catch((err: Error) => setAddError(err.message))
			.finally(() => setAdding(false));
	};

	// Inline edit / delete

	const handleToggleActive = (word: WordRow) => {
		updateWord(word.id, { is_active: !word.is_active })
			.then(() => load())
			.catch((err: Error) => setError(err.message));
	};

	const handleDelete = (word: WordRow) => {
		if (!window.confirm(`Delete "${word.word}"? This cannot be undone.`)) return;

		deleteWord(word.id)
			.then(() => {
				setSelectedIds((prev) => { const n = new Set(prev); n.delete(word.id); return n; });
				load();
			})
			.catch((err: Error) => setError(err.message));
	};

	const startEdit = (word: WordRow) => { setEditingId(word.id); setEditValue(word.word); };

	const saveEdit = (word: WordRow) => {
		const trimmed = editValue.trim().toLowerCase();
		if (trimmed === word.word) { setEditingId(null); return; }
		updateWord(word.id, { word: trimmed })
			.then(() => { setEditingId(null); load(); })
			.catch((err: Error) => setError(err.message));
	};

	// Selection helpers

	const allPageSelected = words.length > 0 && words.every((w) => selectedIds.has(w.id));
	const somePageSelected = words.some((w) => selectedIds.has(w.id));

	const toggleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (e.target.checked) { words.forEach((w) => next.add(w.id)); }
			else { words.forEach((w) => next.delete(w.id)); }
			return next;
		});
	};

	const toggleSelectOne = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) { next.delete(id); } else { next.add(id); }
			return next;
		});
	};

	// Bulk delete
	const handleBulkDelete = () => {
		if (selectedIds.size === 0) return;

		const count = selectedIds.size;
		if (!window.confirm(`Permanently delete ${count} selected word${count === 1 ? '' : 's'}? This cannot be undone.`)) return;

		setBulkDeleting(true);
		setBulkNotice(null);

		bulkDeleteWords([...selectedIds])
			.then((res) => {
				setBulkNotice({ type: 'success', msg: `Deleted ${res.deleted_count} word${res.deleted_count === 1 ? '' : 's'}.` });
				setSelectedIds(new Set());
				load(1, search);
				setPage(1);
			})
			.catch((err: Error) => setBulkNotice({ type: 'error', msg: err.message }))
			.finally(() => setBulkDeleting(false));
	};

	// Export
	const handleExportSelected = () => {
		if (selectedIds.size === 0) return;
		triggerDownload(buildExportUrl({ format: exportFormat, ids: [...selectedIds] }));
	};

	const handleExportAll = (filter: 'all' | 'active' | 'inactive') => {
		setExportMenuOpen(false);
		triggerDownload(buildExportUrl({ format: exportFormat, filter }));
	};

	// Render

	const hasSelection = selectedIds.size > 0;

	return (
		<div className="wordsprint-words">

			<form onSubmit={handleAdd} className="wordsprint-words__add-form">
				<TextControl
					label="Add a new 5-letter word"
					value={newWord}
					onChange={setNewWord}
					maxLength={5}
					placeholder="apple"
					help="Must be exactly 5 letters, A-Z."
				/>

				<Button variant="primary" type="submit" isBusy={adding} disabled={adding}>
					Add word
				</Button>
			</form>

			{addError && <Notice status="error" isDismissible={false}>{addError}</Notice>}

			{
				bulkNotice && (
					<Notice status={bulkNotice.type} isDismissible onRemove={() => setBulkNotice(null)}>
						{bulkNotice.msg}
					</Notice>
				)
			}


			<div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>

				<div style={{ flex: '1 1 200px', minWidth: '180px' }}>
					<TextControl
						label="Search words"
						value={search}
						onChange={setSearch}
						placeholder="Search…"
					/>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingBottom: '1px' }}>
					{
						hasSelection && (
							<Button
								isDestructive
								variant="secondary"
								onClick={handleBulkDelete}
								isBusy={bulkDeleting}
								disabled={bulkDeleting}
							>
								Delete selected ({selectedIds.size})
							</Button>
						)
					}

					<div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
						<label style={{ fontSize: '12px', color: '#757575', whiteSpace: 'nowrap' }}>Export as:</label>

						<select
							value={exportFormat}
							onChange={(e) => setExportFormat(e.target.value as 'csv' | 'txt')}
							style={{
								fontSize: '13px',
								padding: '6px 8px',
								borderRadius: '3px',
								border: '1px solid #c3c4c7',
								width: '70px',
								cursor: 'pointer',
								background: '#fff',
							}}
							aria-label="Export format"
						>
							<option value="csv">CSV</option>
							<option value="txt">TXT</option>
						</select>
					</div>

					<Button
						variant="secondary"
						onClick={handleExportSelected}
						disabled={!hasSelection}
						title={!hasSelection ? 'Select words below to enable' : `Export ${selectedIds.size} selected`}
					>
						{hasSelection ? `Export selected (${selectedIds.size})` : 'Export selected'}
					</Button>

					<div style={{ position: 'relative' }}>
						<Button
							variant="secondary"
							onClick={() => setExportMenuOpen((v) => !v)}
							aria-haspopup="true"
							aria-expanded={exportMenuOpen}
						>
							Export all ▾
						</Button>

						{
							exportMenuOpen && (
								<div
									role="menu"
									style={{
										position: 'absolute',
										right: 0,
										top: '100%',
										marginTop: '4px',
										background: '#fff',
										border: '1px solid #c3c4c7',
										borderRadius: '4px',
										boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
										zIndex: 100,
										minWidth: '160px',
									}}
								>
									{(['all', 'active', 'inactive'] as const).map((f) => (
										<button
											key={f}
											role="menuitem"
											onClick={() => handleExportAll(f)}
											style={{
												display: 'block',
												width: '100%',
												textAlign: 'left',
												padding: '8px 14px',
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												fontSize: '13px',
												lineHeight: '1.4',
											}}
											onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f0f0f1'; }}
											onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
										>
											{f === 'all' ? 'All words' : f === 'active' ? 'Active only' : 'Inactive only'}
										</button>
									))}
								</div>
							)
						}
					</div>
				</div>
			</div>

			{
				exportMenuOpen && (
					<div
						style={{ position: 'fixed', inset: 0, zIndex: 99 }}
						onClick={() => setExportMenuOpen(false)}
						aria-hidden="true"
					/>
				)
			}

			{error && <Notice status="error" isDismissible={false}>{error}</Notice>}

			{
				loading ? (
					<Spinner />
				) : (
					<>
						<table className="widefat striped wordsprint-words__table">
							<thead>
								<tr>
									<th style={{ width: '32px' }}>
										<input
											type="checkbox"
											aria-label="Select all on this page"
											checked={allPageSelected}
											ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
											onChange={toggleSelectAll}
										/>
									</th>
									<th>Word</th>
									<th>Status</th>
									<th>Times played</th>
									<th>Win rate</th>
									<th>Added</th>
									<th>Actions</th>
								</tr>
							</thead>

							<tbody>
								{
									words.length === 0 && (
										<tr><td colSpan={7}>No words found.</td></tr>
									)
								}

								{
									words.map((word) => (
										<tr key={word.id} style={selectedIds.has(word.id) ? { background: '#f0f6fc' } : undefined}>
											<td>
												<input
													type="checkbox"
													aria-label={`Select "${word.word}"`}
													checked={selectedIds.has(word.id)}
													onChange={() => toggleSelectOne(word.id)}
												/>
											</td>

											<td>
												{editingId === word.id ? (
													<TextControl value={editValue} onChange={setEditValue} maxLength={5} />
												) : (
													<code>{word.word}</code>
												)}
											</td>

											<td>
												<ToggleControl
													checked={word.is_active}
													onChange={() => handleToggleActive(word)}
													label={word.is_active ? 'Active' : 'Inactive'}
												/>
											</td>

											<td>{word.times_played}</td>

											<td>
												{word.times_played > 0
													? `${Math.round((word.times_won / word.times_played) * 100)}%`
													: '—'}
											</td>

											<td>{new Date(word.created_at).toLocaleDateString()}</td>

											<td className="wordsprint-words__actions">
												{editingId === word.id ? (
													<>
														<Button variant="primary" size="small" onClick={() => saveEdit(word)}>Save</Button>
														<Button variant="tertiary" size="small" onClick={() => setEditingId(null)}>Cancel</Button>
													</>
												) : (
													<>
														<Button variant="secondary" size="small" onClick={() => startEdit(word)}>Edit</Button>
														<Button isDestructive variant="tertiary" size="small" onClick={() => handleDelete(word)}>Delete</Button>
													</>
												)}
											</td>
										</tr>
									))
								}
							</tbody>
						</table>

						<div className="wordsprint-words__pagination">
							<Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
								Previous
							</Button>

							<span>Page {page} of {totalPages || 1}</span>

							<Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
								Next
							</Button>
						</div>
					</>
				)
			}
		</div>
	);
}