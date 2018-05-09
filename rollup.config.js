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
        browser: true,
      }),
      builtins(),
      commonjs({
        ignoreGlobal: true,
      }),
      babel({
        exclude: 'node_modules/**',
      }),
      json(),
    ],
  },

  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [
      babel({
        exclude: 'node_modules/**',
      }),
    ],
  },
];
