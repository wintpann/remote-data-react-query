import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import url from '@rollup/plugin-url';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    external: Object.keys(pkg.peerDependencies),
    output: [{ file: pkg.main, format: 'es' }],
    plugins: [
      resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
      commonjs(),
      typescript(),
      url(),
      terser(),
    ],
  },
];
