import { useState } from '@wordpress/element';

export function useLocalStorage<T>(key: string, initial: T): [T, (val: T) => void] {
	const [stored, setStored] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item !== null ? (JSON.parse(item) as T) : initial;
		} 
		catch {
			return initial;
		}
	});

	const set = (val: T): void => {
		setStored(val);
		try {
			window.localStorage.setItem(key, JSON.stringify(val));
		} 
		catch {
			// localStorage unavailable — continue with in-memory state only.
		}
	};

	return [stored, set];
}
