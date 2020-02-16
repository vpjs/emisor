module.exports = {
  'env': {
    'browser': true,
    'node': true,
    'es6': true
  },
  'root': true,
  'parser': 'babel-eslint',
  'parserOptions': {
    'babelOptions': {
      'rootMode': 'upward'
    }
  },
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};