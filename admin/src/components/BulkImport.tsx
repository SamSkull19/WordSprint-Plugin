import { useRef, useState } from '@wordpress/element';
import type { FormEvent, DragEvent } from 'react';
import { Button, TextareaControl, Notice } from '@wordpress/components';
import type { BulkImportResult } from '../types';
import { bulkImportWords } from '../lib/api';

interface BulkImportProps {
	onImported: () => void;
}

// File parsing

/**
 * Parse a CSV or TXT file and extract only the word values.
 *
 * CSV:  reads the header row to find the "word" column index, then
 *       extracts that column from every data row. Falls back to the
 *       first column when no "word" header is found.
 * TXT:  one word per line.
 */
function parseFileContent(content: string, filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();

	if (ext === 'csv') {
		const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
		if (lines.length === 0) return '';

		const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
		const wordColIndex = headers.indexOf('word');

		const colIndex = wordColIndex >= 0 ? wordColIndex : 0;
		const hasHeader = wordColIndex >= 0 || ['id', 'word', 'words', 'no'].includes(headers[0]) || /^\d+$/.test(headers[0]);

		const dataLines = hasHeader ? lines.slice(1) : lines;

		return dataLines
			.map((line) => {
				const cells = line.split(',');
				return cells[colIndex]?.trim() ?? '';
			})
			.filter(Boolean)
			.join('\n');
	}

	// TXT — one word per line.
	return content
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');
}

// Component
export default function BulkImport({ onImported }: BulkImportProps) {
	const [raw, setRaw] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<BulkImportResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// File upload state
	const [fileName, setFileName] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// File handling 

	const processFile = (file: File) => {
		setFileError(null);

		const ext = file.name.split('.').pop()?.toLowerCase();
		if (ext !== 'csv' && ext !== 'txt') {
			setFileError('Only .csv and .txt files are supported.');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			const parsed = parseFileContent(content, file.name);
			setRaw(parsed);
			setFileName(file.name);
			setResult(null);
			setError(null);
		};

		reader.onerror = () => setFileError('Failed to read the file. Please try again.');
		reader.readAsText(file, 'utf-8');
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) processFile(file);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) processFile(file);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = () => setDragging(false);

	const clearFile = () => {
		setFileName(null);
		setRaw('');
		setResult(null);
		setError(null);
		setFileError(null);
	};

	// Submit

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!raw.trim()) return;

		setSubmitting(true);
		setError(null);
		setResult(null);

		bulkImportWords(raw)
			.then((res) => {
				setResult(res);
				setRaw('');
				setFileName(null);
				onImported();
			})
			.catch((err: Error) => setError(err.message))
			.finally(() => setSubmitting(false));
	};

	// Render

	return (
		<div className="wordsprint-bulk-import">

			<div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				style={{
					border: `2px dashed ${dragging ? '#2271b1' : '#c3c4c7'}`,
					borderRadius: '4px',
					padding: '24px 20px',
					textAlign: 'center',
					marginBottom: '16px',
					background: dragging ? '#f0f6fc' : '#fafafa',
					transition: 'border-color 0.15s, background 0.15s',
					cursor: 'pointer',
				}}
				onClick={() => fileInputRef.current?.click()}
				role="button"
				tabIndex={0}
				aria-label="Upload a CSV or TXT file"
				onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,.txt"
					style={{ display: 'none' }}
					onChange={handleFileChange}
					aria-hidden="true"
				/>

				{
					fileName ? (
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
							<span style={{ fontSize: '20px' }}>📄</span>
							<span style={{ fontSize: '14px', fontWeight: 600 }}>{fileName}</span>
							<button
								type="button"
								onClick={(e) => { e.stopPropagation(); clearFile(); }}
								style={{
									background: 'none',
									border: '1px solid #c3c4c7',
									borderRadius: '3px',
									cursor: 'pointer',
									fontSize: '12px',
									padding: '2px 8px',
									color: '#757575',
								}}
								aria-label="Remove file"
							>
								✕ Remove
							</button>
						</div>
					) : (
						<div>
							<p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#1d2327' }}>
								Drop a file here, or click to browse
							</p>

							<p style={{ margin: 0, fontSize: '12px', color: '#757575' }}>
								Accepts <strong>.csv</strong> (reads the <code>word</code> column) or <strong>.txt</strong> (one word per line)
							</p>
						</div>
					)
				}
			</div>

			{
				fileError && (
					<Notice status="error" isDismissible onRemove={() => setFileError(null)}>
						{fileError}
					</Notice>
				)
			}

			<div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 16px' }}>
				<hr style={{ flex: 1, border: 'none', borderTop: '1px solid #dcdcde' }} />

				<span style={{ fontSize: '12px', color: '#757575', whiteSpace: 'nowrap' }}>or paste words below</span>

				<hr style={{ flex: 1, border: 'none', borderTop: '1px solid #dcdcde' }} />
			</div>

			<form onSubmit={handleSubmit}>
				<TextareaControl
					label="Words to import"
					help="One word per line, or comma-separated. Each word must be exactly 5 letters A–Z."
					value={raw}
					onChange={(val) => { setRaw(val); if (val !== raw) setFileName(null); }}
					rows={10}
					placeholder={'apple\nbeach\nchair'}
				/>

				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
					<Button variant="primary" type="submit" isBusy={submitting} disabled={submitting || !raw.trim()}>
						Import words
					</Button>

					{
						raw.trim() && (
							<span style={{ fontSize: '12px', color: '#757575' }}>
								{raw.trim().split(/[\r\n,]+/).filter(Boolean).length} word(s) ready to import
							</span>
						)
					}
				</div>
			</form>

			{
				error && (
					<div style={{ marginTop: '12px' }}>
						<Notice status="error" isDismissible={false}>{error}</Notice>
					</div>
				)
			}


			{
				result && (
					<div className="wordsprint-bulk-import__result" style={{ marginTop: '16px' }}>
						<Notice status="success" isDismissible={false}>
							Added {result.added_count} word{result.added_count === 1 ? '' : 's'}
							{result.skipped_count > 0 && `, skipped ${result.skipped_count}`}.
						</Notice>

						{
							result.added.length > 0 && (
								<details style={{ marginTop: '8px' }}>
									<summary style={{ cursor: 'pointer', fontSize: '13px', color: '#2271b1' }}>
										Show added words ({result.added_count})
									</summary>

									<p style={{ margin: '8px 0 0', fontSize: '13px', fontFamily: 'monospace', lineHeight: 1.8 }}>
										{result.added.join(', ')}
									</p>
								</details>
							)
						}

						{
							result.skipped.length > 0 && (
								<details style={{ marginTop: '8px' }} open>
									<summary style={{ cursor: 'pointer', fontSize: '13px', color: '#d63638' }}>
										Show skipped words ({result.skipped_count})
									</summary>

									<table className="widefat striped" style={{ marginTop: '8px' }}>
										<thead>
											<tr>
												<th>Word</th>
												<th>Reason skipped</th>
											</tr>
										</thead>

										<tbody>
											{
												result.skipped.map((item, idx) => (
													<tr key={idx}>
														<td><code>{item.word}</code></td>
														<td>{item.reason}</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</details>
							)
						}
					</div>
				)
			}
		</div>
	);
}