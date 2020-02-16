//ts-check
import { EmisorCore } from '../../src/index';
import { EmisorPlugin } from '../../src/plugin';
import { randomString } from '../support/helpers';

describe ('EmisorPlugin', () => {
  test('key should be string', () => {

    expect(() => {
      new EmisorPlugin();
    }).toThrowErrorMatchingSnapshot('no key');

    expect(() => {
      new EmisorPlugin({key: 1});
    }).toThrowErrorMatchingSnapshot('wrong type');

    expect(() => {
      new EmisorPlugin({key: ''});
    }).toThrowErrorMatchingSnapshot('empty');
  });

  test('key getter result', () => {
    let key = randomString(),
      e = new EmisorPlugin({key});
    expect(e.key).toBe(key);
  });
});

describe.each([
  ['beforeEmit', 'Before'],
  ['afterEmit', 'After'],
])('EmisorCore using %s based event', (hook, order) => {

  test(`${hook} should be called at lease once`, () => {
    let hookFn = jest.fn(),
      Emitter = new EmisorCore({plugins: [{
        key: 'test',
        [hook]: hookFn
      }]});
    Emitter.on('test', () => {}, {test: 1})
      .emit('test');
    expect(hookFn).toBeCalledWith(
      Emitter,
      {test: 1},
      {},
      {event: 'test', 'handler': expect.any(Function), 'id': expect.any(String)}
    );
  });

  test(`${hook} should be called ${order.toLowerCase()} the handler`, () => {
    let hookFn = jest.fn(),
      handler = jest.fn(),
      Emitter = new EmisorCore({plugins: [{
        key: 'test',
        [hook]: hookFn
      }]});
    Emitter.on('test', handler, {test: 1})
      .emit('test');
      
    expect(hookFn)[`toHaveBeenCalled${order}`](handler);
  });
});