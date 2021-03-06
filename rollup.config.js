import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import pkg from './package.json';
import babel from 'rollup-plugin-babel';

export default [
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
      }),
      builtins(),
      commonjs({
        ignoreGlobal: false,
        namedExports: {
          'node_modules/punycode/punycode.js': [ 'toASCII' ]
        }
      }),
      babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        plugins: ['transform-runtime', 'external-helpers'],
      }),
      json(),
    ],
  },

  {
    input: 'src/index.js',
    external: ['js-yaml', '@octokit/rest'],
    output: { file: pkg.main, format: 'cjs' },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        plugins: ['external-helpers', 'transform-runtime'],
      }),
    ],
  },

  {
    input: 'src/index.js',
    external: ['js-yaml', '@octokit/rest'],
    output: {
      file: pkg.module,
      format: 'es',
    },
  },
];
