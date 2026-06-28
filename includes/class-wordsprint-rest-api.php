<?php
/**
 * Rest API Routes for SS Wordle
 *
 * Game-play routes are server-authoritative: the answer word is never sent
 * to the client until the game ends (won/lost), so the word can't be read
 * out of network responses or React state while a game is in progress.
 *
 * @package WordSprint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WordSprint REST API
 *
 * Handles REST API routes for WordSprint game-play.
 */
class WordSprint_REST_API {
	const NAMESPACE_V1 = 'wordsprint/v1';
	// --- Public game-play routes ---
	/**
	 * Register all REST routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_V1,
			'game/new',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'new_game' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/game/(?P<game_id>[a-zA-Z0-9_-]+)/guess',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'submit_guess' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'guess' => array(
						'required' => true,
						'type'     => 'string',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/leaderboard',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_leaderboard' ),
				'permission_callback' => '__return_true',
			)
		);

		// --- Admin-only word management routes ---
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/words',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'admin_list_words' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'admin_create_word' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/words/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'admin_update_word' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'admin_delete_word' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/stats',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'admin_get_stats' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			)
		);

		// --- Appearance settings ---
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/appearance',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_appearance' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_appearance' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
			)
		);

		// --- Bulk Word Insert ---
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/words/bulk',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'admin_bulk_create_words' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			)
		);

		// Bulk Export Txt or CSV both.
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/words/export',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'admin_export_words' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				'args'                => array(
					'format' => array(
						'type'    => 'string',
						'enum'    => array( 'csv', 'txt' ),
						'default' => 'csv',
					),
					'filter' => array(
						'type'    => 'string',
						'enum'    => array( 'all', 'active', 'inactive' ),
						'default' => 'all',
					),
					'ids'    => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
				),
			)
		);

		// Bulk Word Delete.
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/words/bulk-delete',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'admin_bulk_delete_words' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				'args'                => array(
					'ids' => array(
						'required'          => true,
						'type'              => 'array',
						'items'             => array( 'type' => 'integer' ),
						'sanitize_callback' => static function ( $val ) {
							return array_values( array_filter( array_map( 'intval', (array) $val ) ) );
						},
					),
				),
			)
		);

		// Game settings (title, etc.).
		register_rest_route(
			self::NAMESPACE_V1,
			'/admin/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
					'args'                => array(
						'game_title'        => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'default'           => '',
						),
						'font_family'       => array(
							'type'    => 'string',
							'enum'    => array(
								'system',
								'inter',
								'roboto',
								'lato',
								'montserrat',
								'merriweather',
								'playfair',
								'sourcecodepro',
							),
							'default' => 'system',
						),
						'tile_shape'        => array(
							'type'    => 'string',
							'enum'    => array( 'rounded', 'square' ),
							'default' => 'rounded',
						),
						'title_font_family' => array(
							'type'    => 'string',
							'enum'    => array(
								'system',
								'inter',
								'roboto',
								'lato',
								'montserrat',
								'merriweather',
								'playfair',
								'sourcecodepro',
							),
							'default' => 'system',
						),
						'title_font_size'   => array(
							'type'    => 'string',
							'enum'    => array( 'xs', 'sm', 'md', 'lg', 'xl' ),
							'default' => 'xs',
						),
					),

				),
			)
		);
	}

	/**
	 * Get game settings (title, etc.).
	 *
	 * @return WP_REST_Response
	 */
	public static function get_settings(): WP_REST_Response {
		$saved = get_option( 'wordsprint_settings', array() );
		return new WP_REST_Response( array_merge( self::settings_defaults(), $saved ), 200 );
	}

	/**
	 * Save game settings.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function save_settings( WP_REST_Request $request ): WP_REST_Response {
		$allowed_fonts       = array(
			'system',
			'inter',
			'roboto',
			'lato',
			'montserrat',
			'merriweather',
			'playfair',
			'sourcecodepro',
		);
		$allowed_shapes      = array( 'rounded', 'square' );
		$allowed_title_sizes = array( 'xs', 'sm', 'md', 'lg', 'xl' );

		$font       = sanitize_text_field( (string) $request->get_param( 'font_family' ) );
		$shape      = sanitize_text_field( (string) $request->get_param( 'tile_shape' ) );
		$title_font = sanitize_text_field( (string) $request->get_param( 'title_font_family' ) );
		$title_size = sanitize_text_field( (string) $request->get_param( 'title_font_size' ) );

		$data = array(
			'game_title'        => sanitize_text_field( (string) $request->get_param( 'game_title' ) ),
			'font_family'       => in_array( $font, $allowed_fonts, true ) ? $font : 'system',
			'tile_shape'        => in_array( $shape, $allowed_shapes, true ) ? $shape : 'rounded',
			'title_font_family' => in_array( $title_font, $allowed_fonts, true ) ? $title_font : 'system',
			'title_font_size'   => in_array( $title_size, $allowed_title_sizes, true ) ? $title_size : 'xs',
		);

		update_option( 'wordsprint_settings', $data );
		return new WP_REST_Response( array_merge( self::settings_defaults(), $data ), 200 );
	}


	/**
	 * Default game settings.
	 *
	 * @return array
	 */
	public static function settings_defaults(): array {
		return array(
			'game_title'        => '',
			'font_family'       => 'system',
			'tile_shape'        => 'rounded',
			'title_font_family' => 'system',
			'title_font_size'   => 'xs',
		);
	}


	/**
	 * Bulk-delete words by ID list.
	 *
	 * Accepts a JSON body: { "ids": [1, 2, 3] }
	 * Returns: { "deleted_count": N, "ids": [...] }
	 *
	 * IDs that don't exist are silently skipped (no error).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function admin_bulk_delete_words( WP_REST_Request $request ) {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();

		$ids = $request->get_param( 'ids' );

		if ( empty( $ids ) ) {
			return new WP_Error(
				'wordsprint_no_ids',
				__( 'No IDs provided.', 'wordsprint' ),
				array( 'status' => 400 )
			);
		}

		// Cast every entry to int and drop zeroes (belt-and-suspenders on top of sanitize_callback).
		$ids = array_values( array_filter( array_map( 'intval', $ids ) ) );

		if ( empty( $ids ) ) {
			return new WP_Error(
				'wordsprint_invalid_ids',
				__( 'No valid IDs provided.', 'wordsprint' ),
				array( 'status' => 400 )
			);
		}

		$placeholders = implode( ', ', array_fill( 0, count( $ids ), '%d' ) );

		$deleted = $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'DELETE FROM ' . esc_sql( $words_table ) . ' WHERE id IN (' . $placeholders . ')', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				...$ids
			)
		);

		return new WP_REST_Response(
			array(
				'deleted_count' => (int) $deleted,
				'ids'           => $ids,
			),
			200
		);
	}

	/**
	 * Export words as a downloadable CSV or plain-text file.
	 *
	 * Query params:
	 *   format  csv|txt                (default: csv)
	 *   filter  all|active|inactive    (default: all; ignored when ids are provided)
	 *   ids     comma-separated IDs    (optional; when set, overrides filter)
	 *
	 * @param WP_REST_Request $request Request.
	 */
	public static function admin_export_words( WP_REST_Request $request ) {
		global $wpdb;
		$words_table   = WordSprint_DB::words_table();
		$escaped_table = esc_sql( $words_table );

		$format = $request->get_param( 'format' ); // csv | txt.
		$filter = $request->get_param( 'filter' ); // all | active | inactive.
		$ids    = $request->get_param( 'ids' );

		// --- Build query ---
		if ( ! empty( $ids ) ) {
			$id_list = array_filter(
				array_map( 'intval', explode( ',', $ids ) )
			);

			if ( empty( $id_list ) ) {
				return new WP_REST_Response(
					array( 'message' => __( 'No valid IDs provided.', 'wordsprint' ) ),
					400
				);
			}

			$placeholders = implode( ', ', array_fill( 0, count( $id_list ), '%d' ) );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT id, word, is_active, times_played, times_won, created_at FROM ' . $escaped_table . ' WHERE id IN (' . $placeholders . ') ORDER BY word ASC', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					...$id_list
				)
			);
		} else {
			if ( 'active' === $filter ) {
				$where = 'WHERE is_active = 1';
			} elseif ( 'inactive' === $filter ) {
				$where = 'WHERE is_active = 0';
			} else {
				$where = '';
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
			$rows = $wpdb->get_results(
				'SELECT id, word, is_active, times_played, times_won, created_at FROM ' . $escaped_table . ' ' . $where . ' ORDER BY word ASC' // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
			);
		}

		if ( empty( $rows ) ) {
			return new WP_REST_Response(
				array( 'message' => __( 'No words to export.', 'wordsprint' ) ),
				404
			);
		}

		// --- Filename ---
		$timestamp = gmdate( 'Y-m-d' );
		$suffix    = ! empty( $ids ) ? 'selected' : $filter;
		$filename  = "wordsprint-words-{$suffix}-{$timestamp}.{$format}";

		// --- Stream ---
		header( 'Content-Type: ' . ( 'csv' === $format ? 'text/csv' : 'text/plain' ) . '; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Cache-Control: no-cache, no-store, must-revalidate' );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		if ( 'csv' === $format ) {
			// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
			echo "id,word,is_active,times_played,times_won,created_at\r\n";
			foreach ( $rows as $row ) {
				echo implode(
					',',
					array(
						(int) $row->id,
						$row->word,
						(int) $row->is_active,
						(int) $row->times_played,
						(int) $row->times_won,
						$row->created_at,
					)
				) . "\r\n";
			}
			// phpcs:enable
		} else {
			foreach ( $rows as $row ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $row->word . "\n";
			}
		}

		exit;
	}

	/**
	 * Get appearance settings.
	 *
	 * @return WP_REST_Response REST response with appearance settings.
	 */
	public static function get_appearance(): WP_REST_Response {
		$defaults = self::appearance_defaults();

		$saved = get_option( 'wordsprint_appearance', array() );

		return new WP_REST_Response( array_merge( $defaults, $saved ), 200 );
	}

	/**
	 * Save appearance settings.
	 *
	 * @param WP_REST_Request $request REST request object.
	 * @return WP_REST_Response REST response with saved appearance settings.
	 */
	public static function save_appearance( WP_REST_Request $request ): WP_REST_Response {
		$allowed = array_keys( self::appearance_defaults() );
		$data    = array();

		foreach ( $allowed as $key ) {
			$val = $request->get_param( $key );
			if ( null !== $val && preg_match( '/^#[0-9a-fA-F]{6}$/', $val ) ) {
				$data[ $key ] = sanitize_hex_color( $val );
			}
		}

		update_option( 'wordsprint_appearance', $data );
		return new WP_REST_Response( array_merge( self::appearance_defaults(), $data ), 200 );
	}

	/**
	 * Get default appearance settings.
	 *
	 * @return array Default appearance color settings.
	 */
	public static function appearance_defaults(): array {
		return array(
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
	}

	/**
	 * Permission check shared by all /admin/* routes.
	 *
	 * @return bool
	 */
	public static function check_admin_permission() {
		return current_user_can( 'manage_options' );
	}

	// Game play.

	/**
	 * Start a new game: pick a random active word, create a short-lived
	 * transient holding the answer keyed by an opaque game_id, and return
	 * only the game_id (never the word) to the client.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function new_game() {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();

		$word_row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT id, word FROM ' . esc_sql( $words_table ) . ' WHERE is_active = 1 ORDER BY RAND() LIMIT 1'
			)
		);

		if ( ! $word_row ) {
			return new WP_Error(
				'wordsprint_no_words',
				__( 'No active words are configured yet. Please ask an admin to add some.', 'wordsprint' ),
				array( 'status' => 503 )
			);
		}

		$game_id = wp_generate_uuid4();

		set_transient(
			'wordsprint_game_' . $game_id,
			array(
				'word_id' => (int) $word_row->id,
				'word'    => strtoupper( $word_row->word ),
				'guesses' => array(),
			),
			HOUR_IN_SECONDS
		);

		return new WP_REST_Response(
			array(
				'game_id'     => $game_id,
				'word_length' => 5,
				'max_guesses' => 6,
			),
			201
		);
	}

	/**
	 * Submit a guess for an in-progress game. Evaluates server-side and
	 * returns per-tile statuses. Only reveals the answer once the game
	 * has ended (won, or max guesses exhausted).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function submit_guess( WP_REST_Request $request ) {
		$game_id   = $request->get_param( 'game_id' );
		$raw_guess = strtoupper( trim( (string) $request->get_param( 'guess' ) ) );
		$client_id = sanitize_text_field( (string) $request->get_param( 'player_uuid' ) );
		$display   = sanitize_text_field( (string) $request->get_param( 'display_name' ) );

		if ( 5 !== strlen( $raw_guess ) || ! ctype_alpha( $raw_guess ) ) {
			return new WP_Error( 'wordsprint_invalid_guess', __( 'Guess must be a 5-letter word.', 'wordsprint' ), array( 'status' => 400 ) );
		}

		$transient_key = 'wordsprint_game_' . $game_id;
		$game          = get_transient( $transient_key );

		if ( false === $game ) {
			return new WP_Error( 'wordsprint_game_not_found', __( 'Game not found or expired. Please start a new game.', 'wordsprint' ), array( 'status' => 404 ) );
		}

		$answer         = $game['word'];
		$answer_chars   = str_split( $answer );
		$guess_chars    = str_split( $raw_guess );
		$used_in_answer = array_fill( 0, 5, false );
		$result         = array_fill( 0, 5, 'absent' );

		foreach ( $guess_chars as $i => $ch ) {
			if ( $ch === $answer_chars[ $i ] ) {
				$result[ $i ]         = 'correct';
				$used_in_answer[ $i ] = true;
			}
		}

		foreach ( $guess_chars as $i => $ch ) {
			if ( 'correct' === $result[ $i ] ) {
				continue;
			}
			foreach ( $answer_chars as $j => $ach ) {
				if ( $ach === $ch && ! $used_in_answer[ $j ] ) {
					$result[ $i ]         = 'present';
					$used_in_answer[ $j ] = true;
					break;
				}
			}
		}

		$tiles = array();
		foreach ( $guess_chars as $i => $ch ) {
			$tiles[] = array(
				'letter' => $ch,
				'status' => $result[ $i ],
			);
		}

		$game['guesses'][] = $tiles;
		$guesses_used      = count( $game['guesses'] );
		$is_win            = ( $raw_guess === $answer );
		$is_loss           = ( ! $is_win && $guesses_used >= 6 );

		$response = array(
			'tiles'        => $tiles,
			'guesses_used' => $guesses_used,
			'status'       => $is_win ? 'won' : ( $is_loss ? 'lost' : 'playing' ),
		);

		if ( $is_win || $is_loss ) {
			$response['answer'] = $answer;
			delete_transient( $transient_key );
			self::record_result( $game['word_id'], $client_id, $display, $is_win, $guesses_used, $request );
		} else {
			set_transient( $transient_key, $game, HOUR_IN_SECONDS );
		}

		return new WP_REST_Response( $response, 200 );
	}


	/**
	 * Persist a completed game's result for stats/leaderboard purposes,
	 * and bump the word's aggregate play/win counters.
	 *
	 * @param int             $word_id      Word row ID.
	 * @param string          $player_uuid  Client-generated UUID (anonymous identity).
	 * @param string          $display_name Display name chosen client-side (or WP display name).
	 * @param bool            $won          Whether the game was won.
	 * @param int             $guesses_used Number of guesses used.
	 * @param WP_REST_Request $request      Original request (used to read optional duration).
	 * @return void
	 */
	private static function record_result( $word_id, $player_uuid, $display_name, $won, $guesses_used, WP_REST_Request $request ) {
		global $wpdb;

		$user_id = get_current_user_id();
		if ( $user_id ) {
			$user         = get_userdata( $user_id );
			$display_name = $user ? $user->display_name : $display_name;
		}

		if ( '' === $display_name ) {
			$display_name = __( 'Anonymous', 'wordsprint' );
		}

		$duration = $request->get_param( 'duration_seconds' );

		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			WordSprint_DB::results_table(),
			array(
				'word_id'          => (int) $word_id,
				'player_uuid'      => '' !== $player_uuid ? $player_uuid : 'unknown',
				'display_name'     => $display_name,
				'user_id'          => $user_id ? $user_id : null,
				'status'           => $won ? 'won' : 'lost',
				'guesses_used'     => (int) $guesses_used,
				'duration_seconds' => is_numeric( $duration ) ? (int) $duration : null,
			),
			array( '%d', '%s', '%s', '%d', '%s', '%d', '%d' )
		);

		$words_table = WordSprint_DB::words_table();
		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'UPDATE ' . esc_sql( $words_table ) . ' SET times_played = times_played + 1, times_won = times_won + %d WHERE id = %d',
				$won ? 1 : 0,
				$word_id
			)
		);
	}

	/**
	 * Get leaderboard rows, ranked by win streak (consecutive wins in their
	 * most recent games) then by total wins, per player_uuid / user_id.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_leaderboard() {
		global $wpdb;
		$results_table = WordSprint_DB::results_table();

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT 
					user_id,
					player_uuid,
					MAX(display_name) AS display_name,
					COUNT(*) AS games_played,
					SUM(CASE WHEN status = %s THEN 1 ELSE 0 END) AS wins,
					AVG(CASE WHEN status = %s THEN guesses_used ELSE NULL END) AS avg_guesses,
					MAX(played_at) AS last_played
				FROM ' . esc_sql( $results_table ) . '
				GROUP BY CASE WHEN user_id IS NOT NULL THEN CONCAT(%s, user_id) ELSE CONCAT(%s, player_uuid) END
				ORDER BY wins DESC, avg_guesses ASC
				LIMIT %d',
				'won',
				'won',
				'u',
				'g',
				50
			)
		);

		$leaderboard = array();
		foreach ( $rows as $row ) {
			$leaderboard[] = array(
				'display_name' => $row->display_name,
				'is_member'    => null !== $row->user_id,
				'games_played' => (int) $row->games_played,
				'wins'         => (int) $row->wins,
				'win_rate'     => $row->games_played > 0 ? round( ( $row->wins / $row->games_played ) * 100 ) : 0,
				'avg_guesses'  => null !== $row->avg_guesses ? round( (float) $row->avg_guesses, 2 ) : null,
				'last_played'  => $row->last_played,
			);
		}

		return new WP_REST_Response( $leaderboard, 200 );
	}

	// Admin: word management.
	/**
	 * List words with optional search + pagination.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function admin_list_words( WP_REST_Request $request ) {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();

		$search         = sanitize_text_field( (string) $request->get_param( 'search' ) );
		$pattern_param  = sanitize_text_field( (string) $request->get_param( 'letter_pattern' ) );
		$page_param     = $request->get_param( 'page' );
		$page           = max( 1, (int) $page_param ? (int) $page_param : 1 );
		$per_page_param = $request->get_param( 'per_page' );
		$per_page       = min( 100, max( 1, (int) $per_page_param ? (int) $per_page_param : 20 ) );
		$offset         = ( $page - 1 ) * $per_page;

		$escaped_table = esc_sql( $words_table );

		$letter_pattern = '';
		if ( '' !== $pattern_param ) {
			$normalized = strtolower( $pattern_param );
			for ( $i = 0; $i < 5; $i++ ) {
				$char            = isset( $normalized[ $i ] ) ? $normalized[ $i ] : '_';
				$letter_pattern .= ( $char >= 'a' && $char <= 'z' ) ? $char : '_';
			}
		}

		$where_clauses = array();
		$where_args    = array();

		if ( '' !== $search ) {
			$where_clauses[] = 'word LIKE %s';
			$where_args[]    = '%' . $wpdb->esc_like( strtolower( $search ) ) . '%';
		}

		if ( '' !== $letter_pattern && '_____' !== $letter_pattern ) {
			$escaped_pattern = str_replace( array( '\\', '%' ), array( '\\\\', '\\%' ), $letter_pattern );
			$where_clauses[] = 'word LIKE %s';
			$where_args[]    = $escaped_pattern;
		}

		$where_sql = $where_clauses ? ( ' WHERE ' . implode( ' AND ', $where_clauses ) ) : '';

		if ( $where_args ) {
			$total = (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					'SELECT COUNT(*) FROM ' . $escaped_table . $where_sql, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$where_args
				)
			);

			$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					'SELECT id, word, is_active, times_played, times_won, created_at FROM ' . $escaped_table . $where_sql . ' ORDER BY created_at DESC LIMIT %d OFFSET %d', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					array_merge( $where_args, array( $per_page, $offset ) )
				)
			);
		} else {
			$total = (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				'SELECT COUNT(*) FROM ' . $escaped_table // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
			);

			$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					'SELECT id, word, is_active, times_played, times_won, created_at FROM ' . $escaped_table . ' ORDER BY created_at DESC LIMIT %d OFFSET %d', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$per_page,
					$offset
				)
			);
		}

		$words = array_map(
			static function ( $row ) {
				return array(
					'id'           => (int) $row->id,
					'word'         => $row->word,
					'is_active'    => (bool) $row->is_active,
					'times_played' => (int) $row->times_played,
					'times_won'    => (int) $row->times_won,
					'created_at'   => $row->created_at,
				);
			},
			$rows
		);

		return new WP_REST_Response(
			array(
				'words'       => $words,
				'total'       => $total,
				'page'        => $page,
				'per_page'    => $per_page,
				'total_pages' => (int) ceil( $total / $per_page ),
			),
			200
		);
	}

	/**
	 * Validate a single word string. Returns true, or a WP_Error.
	 *
	 * @param string $word Candidate word.
	 * @return true|WP_Error
	 */
	private static function validate_word( $word ) {
		$word = strtolower( trim( $word ) );

		if ( 5 !== strlen( $word ) ) {
			return new WP_Error(
				'wordsprint_invalid_length',
				sprintf(
				/* translators: %s: the offending word */
					__( '"%s" is not exactly 5 letters.', 'wordsprint' ),
					$word
				)
			);
		}

		if ( ! ctype_alpha( $word ) ) {
			return new WP_Error(
				'wordsprint_invalid_chars',
				sprintf(
				/* translators: %s: the offending word */
					__( '"%s" must contain only letters A-Z.', 'wordsprint' ),
					$word
				)
			);
		}

		return true;
	}

	/**
	 * Create a single new word.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function admin_create_word( WP_REST_Request $request ) {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();

		$word       = strtolower( trim( (string) $request->get_param( 'word' ) ) );
		$validation = self::validate_word( $word );

		if ( is_wp_error( $validation ) ) {
			$validation->add_data( array( 'status' => 400 ) );
			return $validation;
		}

		$existing = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT id FROM ' . esc_sql( $words_table ) . ' WHERE word = %s', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$word
			)
		);

		if ( $existing ) {
			return new WP_Error( 'wordsprint_duplicate', __( 'That word is already in the list.', 'wordsprint' ), array( 'status' => 409 ) );
		}

		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$words_table,
			array(
				'word'      => $word,
				'is_active' => 1,
				'added_by'  => get_current_user_id(),
			),
			array( '%s', '%d', '%d' )
		);

		return new WP_REST_Response(
			array(
				'id'        => (int) $wpdb->insert_id,
				'word'      => $word,
				'is_active' => true,
			),
			201
		);
	}

	/**
	 * Bulk-create words from a newline/comma separated list. Skips
	 * duplicates and invalid entries, returning a per-word report.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function admin_bulk_create_words( WP_REST_Request $request ) {
		global $wpdb;
		$words_table   = WordSprint_DB::words_table();
		$escaped_table = esc_sql( $words_table );

		$raw   = (string) $request->get_param( 'words' );
		$parts = preg_split( '/[\r\n,]+/', $raw );
		$parts = array_filter( array_map( 'trim', $parts ) );

		$added   = array();
		$skipped = array();

		foreach ( $parts as $candidate ) {
			$word       = strtolower( $candidate );
			$validation = self::validate_word( $word );

			if ( is_wp_error( $validation ) ) {
				$skipped[] = array(
					'word'   => $candidate,
					'reason' => $validation->get_error_message(),
				);
				continue;
			}

			$existing = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					'SELECT id FROM ' . $escaped_table . ' WHERE word = %s', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$word
				)
			);

			if ( $existing ) {
				$skipped[] = array(
					'word'   => $word,
					'reason' => __( 'Already exists.', 'wordsprint' ),
				);
				continue;
			}

			$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$words_table,
				array(
					'word'      => $word,
					'is_active' => 1,
					'added_by'  => get_current_user_id(),
				),
				array( '%s', '%d', '%d' )
			);

			$added[] = $word;
		}

		return new WP_REST_Response(
			array(
				'added'         => $added,
				'skipped'       => $skipped,
				'added_count'   => count( $added ),
				'skipped_count' => count( $skipped ),
			),
			200
		);
	}

	/**
	 * Update a word (edit text, and/or toggle active state).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function admin_update_word( WP_REST_Request $request ) {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();
		$id          = (int) $request->get_param( 'id' );

		$existing_row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT id FROM ' . esc_sql( $words_table ) . ' WHERE id = %d', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$id
			)
		);

		if ( ! $existing_row ) {
			return new WP_Error( 'wordsprint_not_found', __( 'Word not found.', 'wordsprint' ), array( 'status' => 404 ) );
		}

		$update  = array();
		$formats = array();

		if ( null !== $request->get_param( 'word' ) ) {
			$word       = strtolower( trim( (string) $request->get_param( 'word' ) ) );
			$validation = self::validate_word( $word );
			if ( is_wp_error( $validation ) ) {
				$validation->add_data( array( 'status' => 400 ) );
				return $validation;
			}
			$update['word'] = $word;
			$formats[]      = '%s';
		}

		if ( null !== $request->get_param( 'is_active' ) ) {
			$update['is_active'] = (bool) $request->get_param( 'is_active' ) ? 1 : 0;
			$formats[]           = '%d';
		}

		if ( empty( $update ) ) {
			return new WP_Error( 'wordsprint_no_fields', __( 'No updatable fields were provided.', 'wordsprint' ), array( 'status' => 400 ) );
		}

		$wpdb->update( $words_table, $update, array( 'id' => $id ), $formats, array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		return new WP_REST_Response(
			array(
				'id'      => $id,
				'updated' => array_keys( $update ),
			),
			200
		);
	}

	/**
	 * Delete a word.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function admin_delete_word( WP_REST_Request $request ) {
		global $wpdb;
		$words_table = WordSprint_DB::words_table();
		$id          = (int) $request->get_param( 'id' );

		$deleted = $wpdb->delete( $words_table, array( 'id' => $id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		if ( ! $deleted ) {
			return new WP_Error( 'wordsprint_not_found', __( 'Word not found.', 'wordsprint' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response(
			array(
				'id'      => $id,
				'deleted' => true,
			),
			200
		);
	}

	/**
	 * Aggregate stats for the admin dashboard: totals, win rate, and the
	 * words most often missed (lowest win rate among played words).
	 *
	 * @return WP_REST_Response
	 */
	public static function admin_get_stats() {
		global $wpdb;
		$results_table = WordSprint_DB::results_table();
		$words_table   = WordSprint_DB::words_table();

		$totals = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT
					COUNT(*) AS games_played,
					SUM(CASE WHEN status = %s THEN 1 ELSE 0 END) AS wins,
					AVG(CASE WHEN status = %s THEN guesses_used ELSE NULL END) AS avg_guesses
				FROM ' . esc_sql( $results_table ), // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				'won',
				'won'
			)
		);

		$most_missed_sql = 'SELECT word, times_played, times_won,
				(times_played - times_won) AS misses,
				CASE WHEN times_played > 0 THEN ROUND((times_won / times_played) * 100) ELSE 0 END AS win_rate
			FROM ' . esc_sql( $words_table ) . '
			WHERE times_played > 0
			ORDER BY win_rate ASC, times_played DESC
			LIMIT 10';

		$most_missed = $wpdb->get_results( $most_missed_sql ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared

		return new WP_REST_Response(
			array(
				'games_played' => $totals ? (int) $totals->games_played : 0,
				'wins'         => $totals ? (int) $totals->wins : 0,
				'win_rate'     => ( $totals && $totals->games_played > 0 ) ? round( ( $totals->wins / $totals->games_played ) * 100 ) : 0,
				'avg_guesses'  => ( $totals && null !== $totals->avg_guesses ) ? round( (float) $totals->avg_guesses, 2 ) : null,
				'most_missed'  => array_map(
					static function ( $row ) {
						return array(
							'word'         => $row->word,
							'times_played' => (int) $row->times_played,
							'times_won'    => (int) $row->times_won,
							'win_rate'     => (int) $row->win_rate,
						);
					},
					$most_missed
				),
			),
			200
		);
	}
}
