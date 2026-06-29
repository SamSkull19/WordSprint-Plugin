<?php
/**
 * Autoloader for WordSprint plugin.
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

spl_autoload_register( 'wordsprint_autoloader' );

/**
 * Autoload classes prefixed with "WordSprint_" by requiring the corresponding
 * file from the includes directory. Class names are converted to
 * lowercase, underscores are replaced with dashes and the file is
 * expected to be named class-{name}.php.
 *
 * @param string $class_name Fully-qualified class name.
 * @return bool|null False if the class should not be handled or file not found,
 *                   null on successful require.
 */
function wordsprint_autoloader( $class_name ) {
	if ( strpos( $class_name, 'WordSprint_' ) !== 0 ) {
		return false;
	}

	$lower_case = strtolower( $class_name );
	$add_dash   = str_replace( '_', '-', $lower_case );

	$file_name = 'class-' . $add_dash . '.php';
	$file_path = WORDSPRINT_PLUGIN_DIR . 'includes/' . $file_name;

	if ( ! file_exists( $file_path ) ) {
		return false;
	}

	require_once $file_path;
}
