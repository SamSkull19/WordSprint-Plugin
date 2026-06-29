<?php
/**
 * Admin menu page + asset loading for the React/TS admin app
 * (word management, bulk import, stats, leaderboard view).
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin class for registering the WordSprint admin menu and loading assets.
 *
 * @package WordSprint
 */
class WordSprint_Admin {

	const PAGE_SLUG = 'wordsprint';

	/**
	 * Register the top-level admin menu page.
	 *
	 * @return void
	 */
	public static function register_menu() {
		add_menu_page(
			__( 'WordSprint', 'wordsprint' ),
			__( 'WordSprint', 'wordsprint' ),
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' ),
			'dashicons-grid-view',
			65
		);
	}

	/**
	 * Print the mount point for the admin React app. All actual UI
	 * (tabs for Words / Bulk Import / Stats / Leaderboard) lives in the
	 * compiled bundle.
	 *
	 * @return void
	 */
	public static function render_page() {
		echo '<div id="wordsprint-admin-root" class="wordsprint-admin-root"></div>';
	}

	/**
	 * Enqueue admin bundle only on our own admin page.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public static function enqueue_assets( $hook_suffix ) {
		if ( 'toplevel_page_' . self::PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$asset_file = WORDSPRINT_PLUGIN_DIR . 'build/admin/index.asset.php';
		$asset      = file_exists( $asset_file )
			? include $asset_file
			: array(
				'dependencies' => array( 'wp-element', 'wp-components', 'wp-api-fetch' ),
				'version'      => WORDSPRINT_VERSION,
			);

		wp_enqueue_style(
			'wordsprint-admin',
			WORDSPRINT_PLUGIN_URL . 'build/admin/index.css',
			array( 'wp-components' ),
			$asset['version']
		);

		wp_enqueue_script(
			'wordsprint-admin',
			WORDSPRINT_PLUGIN_URL . 'build/admin/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_localize_script(
			'wordsprint-admin',
			'wordsprintAdminConfig',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
	}
}
