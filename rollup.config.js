import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import url from '@rollup/plugin-url';
import pkg from './package.json';

export default [
  {
    input: 'src/lib/fp/index.ts',
    external: [
      ...Object.keys(pkg.peerDependencies),
      'fp-ts/Option',
      'fp-ts/Either',
      'fp-ts/function',
    ],
    output: [{ file: 'dist/rq/fp/index.js', format: 'es' }],
    plugins: [
      resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
      typescript(),
      url(),
      terser(),
    ],
  },
  {
    input: 'src/lib/lite/index.ts',
    external: Object.keys(pkg.peerDependencies),
    output: [{ file: 'dist/rq/lite/index.js', format: 'es' }],
    plugins: [
      resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
      typescript(),
      url(),
      terser(),
    ],
  },
];
