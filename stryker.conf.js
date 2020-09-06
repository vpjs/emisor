module.exports = {
  testRunner: 'jest',
  coverageAnalysis: 'off',
  mutate: ['packages/**/src/**/*.js'],
  // babel: {
  //   optionsFile: 'babel.config.json'
  // },
  mutator: {
    name: 'javascript',
    plugins: [
      'classPrivateProperties',
      'classPrivateMethods'
    ]
  },
  // transpilers: [
  //   'babel'
  // ],


};