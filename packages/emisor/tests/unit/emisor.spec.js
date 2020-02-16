const { Emisor } = require('../../src');
import { delay } from '../../../../helpers/test';

describe('Emisor', () => {
  let Emitter = new Emisor();
 
  test('Emisor.once', async () => {
    let handler = jest.fn(),
      event = Symbol();
    Emitter.once(event, handler);
    Emitter.emit(event);
    Emitter.emit(event);
    await delay();
    expect(handler).toBeCalledTimes(1);
  });

  test('Emisor.many', async () => {
    let handler = jest.fn(),
      event = Symbol();
    Emitter.many(event, 2, handler);
    Emitter.emit(event);
    Emitter.emit(event);
    Emitter.emit(event);
    await delay();
    expect(handler).toBeCalledTimes(2);
  });

  test('Emisor.history', async () => {
    let handler = jest.fn(),
      event = Symbol();
    Emitter.emit(event, 'test1');
    Emitter.history(event, handler);
    await delay();
    expect(handler).toHaveBeenNthCalledWith(1, 'test1', expect.any(Object));
  });

  test('Emisor.historyOnce', async () => {
    let handler = jest.fn(),
      event = Symbol();
    Emitter.emit(event, 'test1');
    Emitter.historyOnce(event, handler);
    Emitter.emit(event, 'test1');
    await delay();
    expect(handler).toBeCalledTimes(1);
    expect(handler).toHaveBeenNthCalledWith(1, 'test1', expect.any(Object));
  });
});