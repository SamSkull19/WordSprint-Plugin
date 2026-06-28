<?php
/**
 * Fires only when the plugin is deleted via the WordPress admin (Plugins
 * screen), never on simple deactivation. This is the appropriate place for
 * destructive cleanup of plugin-owned tables and options.
 *
 * @package WordSprint
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$words_table   = $wpdb->prefix . 'wordsprint_words';
$results_table = $wpdb->prefix . 'wordsprint_results';

// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
$wpdb->query( "DROP TABLE IF EXISTS {$results_table}" );
$wpdb->query( "DROP TABLE IF EXISTS {$words_table}" );
// phpcs:enable

delete_option( 'wordsprint_db_version' );
