module.exports = { 
  'babelrcRoots': [
    'packages/core',
    'packages/emisor',
    'packages/plugins/*'
  ],
  'presets': [
    ['@babel/preset-env', {
      'modules': false
    }]
  ],
  'plugins': [
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties'
  ],
  'env': {
    'test': {
      'plugins': [
                
        ['module-resolver', {
          'root': ['.'],
          'alias': {
            '@emisor/core': '@emisor/core/src',
            '@emisor/plugin-count': '@emisor/plugin-count/src',
            '@emisor/plugin-history': '@emisor/plugin-history/src',
            'test-helpers': ([, path]) => `${__dirname}/helpers${path}`
          }
        }]
                 
      ],
      'presets': [
        ['@babel/preset-env', {
          'targets': {
            'node': 'current'
          }
        }]
      ]
    }
  }
};