<?php
/**
 * Main class file for the WordSprint plugin.
 *
 * Contains the WordSprint_Main class which initializes the plugin, registers
 * hooks, and handles database upgrades.
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class for WordSprint.
 *
 * Handles initialization, hooks, and database upgrades for the plugin.
 *
 * @package WordSprint
 */
class WordSprint_Main {
	/**
	 * Singleton instance.
	 *
	 * @var WordSprint | null
	 */

	private static $instance = null;

	/**
	 * Get the singleton instance.
	 *
	 * @return WordSprint
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor. Private - use instance().
	 */
	private function __construct() {
		register_deactivation_hook( WORDSPRINT_PLUGIN_FILE, array( 'WordSprint_DB', 'deactivate' ) );

		add_action( 'plugin_loaded', array( $this, 'maybe_upgrade_db' ) );
		add_action( 'init', array( 'WordSprint_Shortcode', 'register' ) );
		add_action( 'rest_api_init', array( 'WordSprint_REST_API', 'register_routes' ) );
		add_action( 'admin_menu', array( 'WordSprint_Admin', 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( 'WordSprint_Admin', 'enqueue_assets' ) );
	}

	/**
	 * Run DB migrations if the stored DB version is stale.
	 *
	 * @return void
	 */
	public function maybe_upgrade_db() {
		$installed_version = get_option( 'wordsprint_db_version', '' );

		if ( WORDSPRINT_DB_VERSION !== $installed_version ) {
			WordSprint_DB::activate();
		}
	}

	/**
	 * Deactivation hook. Intentionally leaves tables/data intact;
	 * Only uninstall.php should perform destructive cleanup.
	 *
	 * @return void
	 */
	public function deactivate() {
	}
}
