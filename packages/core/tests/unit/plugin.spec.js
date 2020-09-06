import { EmisorPlugin } from '../../src/plugin';

describe ('EmisorPlugin', () => {
  test('EmisorPlugin const', () => {
    expect(EmisorPlugin.BREAK_KEY).toEqual(expect.any(Symbol));
    expect(EmisorPlugin.OVERWRITE_HANDLER_KEY).toEqual(expect.any(Symbol));
    expect(EmisorPlugin.OVERWRITE_PAYLOAD_KEY).toEqual(expect.any(Symbol));
    expect(EmisorPlugin.KILL_KEY).toEqual(expect.any(Symbol));
    expect(EmisorPlugin.ADD_TAG).toEqual(expect.any(Symbol));
    expect(EmisorPlugin.REMOVE_TAG).toEqual(expect.any(Symbol));
  });

  test('plugin should have method install', () => {
    expect(() => {
      new EmisorPlugin().install();
    }).toThrowErrorMatchingSnapshot();
  });
});
