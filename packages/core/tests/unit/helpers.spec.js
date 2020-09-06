import { isString, isSymbol, isRegExp, isFunction } from '../../src/helpers';

let TEST_MAP = {
  string: '',
  regexp: /test/,
  function: () => {},
  symbol: Symbol(),
  null: null,
  undefined: void 0,
  array: []
};

describe.each([
  [isSymbol, [Symbol(), Object(Symbol())], 'symbol'],
  [isRegExp, [/test/, new RegExp('test')], 'regexp'],
  [isString, ['', String(), new String()], 'string'],
  [isFunction, [() => {}, function text () {}], 'function']
])('Helpers', (fnc, equals, skip) => {
  test(`${fnc.name} should return true`, () => {
    equals.forEach((value) => {
      expect(fnc(value)).toEqual(true);
    });
  });

  test(`${fnc.name} should return false`, () => {
    Object.entries(TEST_MAP)
    .filter(([key]) => key !== skip)
    .forEach(([,value]) => {
      expect(fnc(value)).toEqual(false);
    });
  });
});