import { EmisorCore } from '@emisor/core';
import { EmisorPluginCount } from '../../src';
import {delay} from 'test-helpers/test';

describe.each([
  [undefined, 1], //default
  [{key: 'c'}, 2], //change key
  [{}, 3] //should go to default
])('EmisorPluginCount config: %s', (config, times) => {
  let Emitter = new EmisorCore({
      plugins: [
        new EmisorPluginCount(config)
      ]
    }),
    {key = 'count'} = config || {};
        
  test(`of subscriber is only called ${times}`, async () => {
    let handler = jest.fn(),
      event = Symbol();
    Emitter.on(event, handler, {[key]: times})
      .emit(event)
      .emit(event)
      .emit(event)
      .emit(event);
    await delay();
    expect(handler).toBeCalledTimes(times);
  });
});

describe('EmisorPluginCount using postfix key', () => {
  let Emitter = new EmisorCore({
    plugins: [
      new EmisorPluginCount()
    ]
  });
  test('of subscriber is only called 2', async () => {
    let handler = jest.fn();
    Emitter.on('test:#2', handler)
      .emit('test')
      .emit('test')
      .emit('test')
      .emit('test');
    await delay();
    expect(handler).toBeCalledTimes(2);
  });
});