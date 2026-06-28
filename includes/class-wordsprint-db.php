<?php
/**
 * Database table creation and migrations.
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles creation and versioning of the plugin's custom tables:
 *
 * - {$prefix}wordsprint_words   : the word pool, each row one 5-letter word.
 * - {$prefix}wordsprint_results : one row per completed (or abandoned) game,
 * used for both stats and the leaderboard.
 */
class WordSprint_DB {

	/**
	 * Get the words table name (with WP table prefix).
	 *
	 * @return string
	 */
	public static function words_table() {
		global $wpdb;
		return $wpdb->prefix . 'wordsprint_words';
	}

	/**
	 * Get the results table name (with WP table prefix).
	 *
	 * @return string
	 */
	public static function results_table() {
		global $wpdb;
		return $wpdb->prefix . 'wordsprint_results';
	}

	/**
	 * Create/upgrade tables via dbDelta and seed default words on first install.
	 *
	 * @return void
	 */
	public static function activate() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();
		$words_table     = self::words_table();
		$results_table   = self::results_table();

		$sql_words = "CREATE TABLE {$words_table} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			word VARCHAR(5) NOT NULL,
			is_active TINYINT(1) NOT NULL DEFAULT 1,
			times_played BIGINT UNSIGNED NOT NULL DEFAULT 0,
			times_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
			added_by BIGINT UNSIGNED NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY word (word),
			KEY is_active (is_active)
		) {$charset_collate};";

		$sql_results = "CREATE TABLE {$results_table} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			word_id BIGINT UNSIGNED NOT NULL,
			player_uuid VARCHAR(64) NOT NULL,
			display_name VARCHAR(100) NOT NULL,
			user_id BIGINT UNSIGNED NULL,
			status VARCHAR(10) NOT NULL,
			guesses_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
			duration_seconds INT UNSIGNED NULL,
			played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY word_id (word_id),
			KEY player_uuid (player_uuid),
			KEY user_id (user_id),
			KEY status (status)
		) {$charset_collate};";

		dbDelta( $sql_words );
		dbDelta( $sql_results );

		self::maybe_seed_default_words();

		update_option( 'wordsprint_db_version', WORDSPRINT_DB_VERSION );
	}

	/**
	 * Seed a small default word list on first install only (idempotent —
	 * skipped if the words table already has rows).
	 *
	 * @return void
	 */
	private static function maybe_seed_default_words() {
		global $wpdb;
		$words_table = self::words_table();

		$existing_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$words_table}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		if ( $existing_count > 0 ) {
			return;
		}

		$seed_words = array(
			'apple',
			'beach',
			'chair',
			'dance',
			'eagle',
			'flame',
			'grape',
			'house',
			'island',
			'jolly',
		);

		$seed_words = array_values(
			array_filter(
				$seed_words,
				static function ( $word ) {
					return 5 === strlen( $word );
				}
			)
		);

		foreach ( $seed_words as $word ) {
			$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$words_table,
				array(
					'word'      => strtolower( $word ),
					'is_active' => 1,
					'added_by'  => null,
				),
				array( '%s', '%d', '%d' )
			);
		}
	}
}
