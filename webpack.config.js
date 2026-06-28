const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );


const plugins = defaultConfig.plugins.map( ( plugin ) =>
	plugin.constructor.name === 'MiniCssExtractPlugin'
		? new MiniCssExtractPlugin( { filename: '[name]/index.css' } )
		: plugin
);

module.exports = {
	...defaultConfig,
	entry: {
		frontend: path.resolve( __dirname, 'frontend/src/index.tsx' ),
		admin: path.resolve( __dirname, 'admin/src/index.tsx' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: '[name]/index.js',
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,

				style: {
					...defaultConfig.optimization.splitChunks.cacheGroups.style,
					name( _module, chunks ) {
						return chunks[ 0 ].name;
					},
				},
			},
		},
	},
	plugins,
};
