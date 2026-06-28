<?php
// phpcs:ignoreFile WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name:         WordSprint
 * Plugin URI:  		https://github.com/SamSkull19/SS-Letter-Quest-Plugingit status
 * Description:         A self-hosted Wordle game with a DB-backed word list, leaderboard, and shortcode embed.
 * Version:             1.0.0
 * Requires at least:   6.0
 * Requires PHP:        7.4
 * Author:              Sifat Samin
 * License:             GPL v2 or later
 * Text Domain:         wordsprint
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WORDSPRINT_VERSION', '1.0.0' );
define( 'WORDSPRINT_PLUGIN_FILE', __FILE__ );
define( 'WORDSPRINT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WORDSPRINT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WORDSPRINT_DB_VERSION', '1.0.0' );

require_once WORDSPRINT_PLUGIN_DIR . 'autoloader/autoloader.php';

register_activation_hook( __FILE__, array( 'WordSprint_DB', 'activate' ) );

WordSprint_Main::instance();
