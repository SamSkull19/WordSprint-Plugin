=== WordSprint ===
Contributors: sifatsamin
Tags: wordle, word game, puzzle, game, shortcode
Requires at least: 6.0
Tested up to: 7.0
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A self-hosted Wordle game for WordPress — with a database-backed word pool, leaderboard, admin word manager, and a simple shortcode embed.

== Description ==

**WordSprint** brings the popular Wordle word-guessing game to your WordPress site. Visitors get 6 attempts to guess a hidden 5-letter word, with colour-coded tile feedback after every guess. Everything runs on your own server — no third-party game API required.

= Source Code =
Full source code including React/TypeScript files:
https://github.com/SamSkull19/WordSprint-Plugin

= How It Works =

Players click "New Game" to receive a randomly selected word from your word pool. After each guess, tiles are coloured green (correct letter, correct position), yellow (correct letter, wrong position), or grey (letter not in the word). The answer is never sent to the browser until the game ends, preventing cheating via browser dev tools.

= Key Features =

**For Players**
* Classic 5-letter, 6-guess Wordle gameplay
* Server-authoritative guess evaluation — the answer is never exposed client-side while the game is in progress
* Leaderboard showing win counts, win rate, and average guesses per player
* Works for both logged-in WordPress members (display name auto-populated) and anonymous guests (identified by a browser-local UUID)
* Embed anywhere on your site with a single shortcode: `[wordsprint]`

**For Admins**
* Full word management panel inside WordPress Admin → WordSprint
* Add, edit, activate/deactivate, or delete individual words
* Bulk import words (newline- or comma-separated) with per-word validation feedback
* Bulk delete selected words in one click
* Export your word list as CSV or plain TXT (filter by all / active / inactive, or export only selected words)
* Live stats dashboard: total games played, overall win rate, average guesses, and a "most missed words" table
* Appearance customiser: change background, tile, keyboard, and result colours to match your site's brand

**Technical**
* Stores words and game results in two custom database tables (`{prefix}wordsprint_words`, `{prefix}wordsprint_results`)
* REST API powered (namespace: `wordsprint/v1`) — all game actions and admin operations go through versioned endpoints
* React + TypeScript frontend for both the game and the admin panel, built with `@wordpress/scripts`
* Assets load only on pages where the shortcode is used (no global JS/CSS bloat)
* Clean uninstall: all plugin tables and options are removed when the plugin is deleted via the WordPress admin

== Credits ==

= Wordle — Original Game Concept =

WordSprint is inspired by **Wordle**, the word-guessing game created by **Josh Wardle** and originally published at powerlanguage.co.uk/wordle. Wordle was acquired by The New York Times in January 2022 and is now available at nytimes.com/games/wordle.

The core gameplay mechanic — six attempts to guess a hidden five-letter word, with colour-coded tile feedback indicating correct letters and positions — is the intellectual creation of Josh Wardle. WordSprint is an independent, self-hosted reimplementation built for WordPress site owners who want to run their own word-game experience. It is not affiliated with, endorsed by, or connected to Josh Wardle or The New York Times Company in any way.

== Installation ==

1. Download the plugin zip file.
2. In your WordPress admin, go to **Plugins → Add New → Upload Plugin**.
3. Choose the zip file and click **Install Now**, then **Activate**.
4. Go to **WordSprint** in the admin menu to add words to your word pool.
5. Edit any page or post, add the shortcode `[wordsprint]`, and publish.

Your visitors can now play Wordle on your site.

**Note:** The plugin ships with a small set of starter words so the game is playable immediately after activation. Replace or expand this list from the **WordSprint → Words** admin panel.

== Frequently Asked Questions ==

= Do I need to add words before the game works? =

No. A small default word list is seeded automatically on first activation so the game is playable right away. You can replace or expand it at any time from the admin panel.

= Can guests (non-logged-in users) play? =

Yes. Guest players are tracked by a UUID stored in their browser's local storage. Their scores appear on the leaderboard under the display name they choose.

= Is the answer ever exposed in the page source or network requests? =

No. The answer word is stored in a server-side transient keyed to an opaque game ID. It is never included in any API response until the game ends (win or loss).

= How do I change the game colours to match my theme? =

Go to **WordPress Admin → WordSprint → Appearance**. You can customise the background, surface, border, tile result colours (correct / present / absent), keyboard colours, and text colour.

= How do I embed the game on a page? =

Add `[wordsprint]` to any page, post, or widget that supports shortcodes.

= Can I export my word list? =

Yes. In **WordSprint → Words**, use the Export button to download your word list as a CSV (with stats) or a plain TXT file (one word per line). You can export all words, only active words, only inactive words, or a manual selection.

= What happens to my data if I delete the plugin? =

All plugin data — the words table, the results table, and the plugin option — is permanently removed when you delete the plugin via **Plugins → Delete** in the WordPress admin. Deactivating the plugin leaves your data intact.

= Does the plugin create any database tables? =

Yes, two custom tables are created on activation:
* `{prefix}wordsprint_words` — stores your word pool
* `{prefix}wordsprint_results` — stores one row per completed game, used for stats and the leaderboard

Both tables are removed cleanly on plugin deletion.

== Screenshots ==

1. The WordSprint game embedded on the front end via `[wordsprint]`
2. In-progress game showing colour-coded tile feedback
3. The leaderboard showing player rankings
4. Admin panel — Words management tab
5. Admin panel — Bulk import tab
6. Admin panel — Stats dashboard
7. Admin panel — Appearance customiser

== Changelog ==

= 1.0.0 =
* Initial release
* Server-authoritative Wordle gameplay with 6-guess limit
* Database-backed word pool with admin management UI
* Bulk word import (newline / comma separated) with per-word validation
* Bulk word export as CSV or TXT
* Leaderboard ranked by wins and average guesses
* Admin stats dashboard with "most missed words" table
* Appearance customiser for game colours
* `[wordsprint]` shortcode embed
* Clean uninstall via `uninstall.php`

== Upgrade Notice ==

= 1.0.0 =
Initial release — no upgrade steps required.