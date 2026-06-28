import { useState } from '@wordpress/element';

interface ShortcodeBadgeProps {
	shortcode: string;
}

export default function ShortcodeBadge({ shortcode }: ShortcodeBadgeProps) {
	const [copied, setCopied] = useState(false);

	const handleClick = () => {
		const text = `[${shortcode}]`;

		const fallbackCopy = () => {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			try {
				document.execCommand('copy');
			}
			catch {
				// Nothing more we can do — clipboard access is unavailable.
			}
			document.body.removeChild(textarea);
		};

		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(text).catch(fallbackCopy);
		}
		else {
			fallbackCopy();
		}

		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<button
			type="button"
			className="wordsprint-shortcode-badge"
			onClick={handleClick}
			title="Click to copy"
		>
			<code>[{shortcode}]</code>

			<span className="wordsprint-shortcode-badge__hint">
				{copied ? 'Copied!' : 'Click to copy'}
			</span>
		</button>
	);
}
