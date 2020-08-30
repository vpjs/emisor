module.exports = {
  'env': {
    'browser': true,
    'node': true,
    'es6': true
  },
  'root': true,
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'babelOptions': {
      'rootMode': 'upward'
    }
  },
  'plugins': [
    'babel'
  ],
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2,
      { 
        'MemberExpression': 0,
        'VariableDeclarator': {
          'var': 2,
          'let': 2,
          'const': 3
        }
      }
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