import { createRoot } from '@wordpress/element';
import App from './App';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('wordsprint-admin-root');

    if (root) {
        createRoot(root).render(<App />);
    }
});
