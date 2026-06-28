<?php
/**
 * [wordsprint] shortcode: enqueues the compiled React/TS game bundle and
 * outputs a mount point div for it.
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shortcode handler for the WordSprint plugin.
 */
class WordSprint_Shortcode {

	/**
	 * Register the shortcode tag.
	 *
	 * @return void
	 */
	public static function register() {
		add_shortcode( 'wordsprint', array( __CLASS__, 'render' ) );
	}

	/**
	 * Render callback. Enqueues frontend assets only on demand (i.e. only
	 * when the shortcode is actually used on the current page) and prints
	 * the mount point.
	 *
	 * @return string
	 */
	public static function render() {
		self::enqueue_assets();

		return '<div id="wordsprint-root" class="wordsprint-root"></div>';
	}

	/**
	 * Enqueue the built frontend bundle and localize the REST URL/nonce
	 * the React app needs to talk to the API.
	 *
	 * @return void
	 */
	private static function enqueue_assets() {
		$asset_file = WORDSPRINT_PLUGIN_DIR . 'build/frontend/index.asset.php';
		$asset      = file_exists( $asset_file )
			? include $asset_file
			: array(
				'dependencies' => array(),
				'version'      => WORDSPRINT_VERSION,
			);

		$appearance = get_option( 'wordsprint_appearance', array() );
		$defaults   = array(
			'color_bg'       => '#121213',
			'color_surface'  => '#1e1e1f',
			'color_border'   => '#3a3a3c',
			'color_muted'    => '#818384',
			'color_correct'  => '#538d4e',
			'color_present'  => '#b59f3b',
			'color_absent'   => '#3a3a3c',
			'color_text'     => '#ffffff',
			'color_key'      => '#818384',
			'color_key_text' => '#ffffff',
		);

		$settings = get_option( 'wordsprint_settings', array() );

		$raw_title  = isset( $settings['game_title'] ) ? trim( $settings['game_title'] ) : '';
		$game_title = '' !== $raw_title ? $raw_title : 'Wordsprint';

		$allowed_fonts = array(
			'system',
			'inter',
			'roboto',
			'lato',
			'montserrat',
			'merriweather',
			'playfair',
			'sourcecodepro',
		);

		$allowed_sizes = array( 'xs', 'sm', 'md', 'lg', 'xl' );

		$font_family = isset( $settings['font_family'] ) && in_array( $settings['font_family'], $allowed_fonts, true )
			? $settings['font_family'] : 'system';

		$tile_shape = isset( $settings['tile_shape'] ) && in_array( $settings['tile_shape'], array( 'rounded', 'square' ), true )
			? $settings['tile_shape'] : 'rounded';

		$title_font_family = isset( $settings['title_font_family'] ) && in_array( $settings['title_font_family'], $allowed_fonts, true )
			? $settings['title_font_family'] : 'system';

		$title_font_size = isset( $settings['title_font_size'] ) && in_array( $settings['title_font_size'], $allowed_sizes, true )
			? $settings['title_font_size'] : 'xs';

		wp_enqueue_style(
			'wordsprint-frontend',
			WORDSPRINT_PLUGIN_URL . 'build/frontend/index.css',
			array(),
			$asset['version']
		);

		wp_enqueue_script(
			'wordsprint-frontend',
			WORDSPRINT_PLUGIN_URL . 'build/frontend/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_localize_script(
			'wordsprint-frontend',
			'wordsprintConfig',
			array(
				'root'            => esc_url_raw( rest_url() ),
				'namespace'       => WordSprint_REST_API::NAMESPACE_V1,
				'nonce'           => wp_create_nonce( 'wp_rest' ),
				'isLoggedIn'      => is_user_logged_in(),
				'displayName'     => is_user_logged_in() ? wp_get_current_user()->display_name : '',
				'appearance'      => array_merge( $defaults, $appearance ),
				'gameTitle'       => $game_title,
				'fontFamily'      => $font_family,
				'tileShape'       => $tile_shape,
				'titleFontFamily' => $title_font_family,
				'titleFontSize'   => $title_font_size,
			)
		);
	}
}
