import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import deepMerge from 'deepmerge';
import { terser } from 'rollup-plugin-terser';
import acornPrivateClassElements from 'acorn-private-class-elements';
import acornPrivateMethods from 'acorn-private-methods';
import cleaner from 'rollup-plugin-cleaner';


export default (config = {}) => deepMerge({
  input: 'src/index.js',
  acornInjectPlugins: [ acornPrivateClassElements, acornPrivateMethods ],
  output: [{
    file: 'dist/index.js',
    format: 'cjs',
  }],
  plugins: [
    cleaner({
      targets: [
        './dist/'
      ]
    }),
    resolve(),
    babel({ rootMode: 'upward', babelHelpers: 'bundled' }),
    terser()
  ]

}, config);