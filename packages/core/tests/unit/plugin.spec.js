import { EmisorPlugin, EmisorPluginTypeError } from '../../src/plugin';

describe ('EmisorPlugin', () => {
  test('plugin should have method install', () => {
    expect(() => {
      new EmisorPlugin().install();
    }).toThrowErrorMatchingSnapshot();
  });

  test('plugin type error', ()  => {
    let error = new EmisorPluginTypeError('x','string', undefined);
    expect(error.message).toEqual('x has to be a string, undefined given');
  });
});