import resolve from '@rollup/plugin-node-resolve';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import deepMerge from 'deepmerge';
import { terser } from 'rollup-plugin-terser';
import acornPrivateClassElements from 'acorn-private-class-elements';
import acornPrivateMethods from 'acorn-private-methods';

export default (config = {}) => deepMerge({
  input: 'src/index.js',
  acornInjectPlugins: [ acornPrivateClassElements, acornPrivateMethods ],
  output: [{
    file: 'dist/index.js',
    format: 'cjs',
    plugins: [
      getBabelOutputPlugin({
        rootMode: 'upward',
        configFile: true
      }),
      terser()
    ]
  }, {
    file: 'dist/index.mjs',
    format: 'es'
  }],
  plugins: [
    resolve()
  ]

}, config);