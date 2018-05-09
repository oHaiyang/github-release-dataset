import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import pkg from './package.json';
import babel from 'rollup-plugin-babel';

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'Smuggler',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true,
      }),
      builtins(),
      commonjs({
        ignoreGlobal: true,
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      json(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  /* {
		input: 'src/index.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
  } */
];
