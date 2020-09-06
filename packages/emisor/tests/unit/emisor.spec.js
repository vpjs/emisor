import { Emisor } from  '../../src';
import { delay } from 'test-helpers/test';

describe('Emisor', () => {
  let Emitter = new Emisor();
  const EmisorSignature = expect.objectContaining({
    on: expect.any(Function),
    off: expect.any(Function),
    emit: expect.any(Function),
    once: expect.any(Function),
    many: expect.any(Function),
    history: expect.any(Function),
    historyOnce: expect.any(Function)
  });

  test('Emisor signature', () => {
    expect(new Emisor()).toEqual(EmisorSignature); 
  });
  
  test('Emisor signature when chaining', () => {
    expect(Emitter.on('test-chaining', () => {})).toEqual(EmisorSignature);
    expect(Emitter.emit('test-chaining')).toEqual(EmisorSignature);
    expect(Emitter.once('test-chaining', () => {})).toEqual(EmisorSignature);
    expect(Emitter.many('test-chaining', 2, () => {})).toEqual(EmisorSignature);
    expect(Emitter.history('test-chaining', () => {})).toEqual(EmisorSignature);
    expect(Emitter.historyOnce('test-chaining', () => {})).toEqual(EmisorSignature);
    expect(Emitter.off()).toEqual(EmisorSignature);

  });

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
    await delay();
    Emitter.history(event, handler);
    await delay();
    expect(handler).toHaveBeenNthCalledWith(1, 'test1', expect.any(Object));
  });


  test('Emisor.history amount', async () => {
    let Emitter = new Emisor({}, {history: {
          maxLength: 2
        }}),
        handler = jest.fn(),
        event = Symbol();
    Emitter
    .emit(event, 'test1')
    .emit(event, 'test2');
    await delay();
    Emitter.history(event, 1, handler);
    await delay();
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledTimes(1, 'test2', expect.any(Object));
  });

  test('Emisor.historyOnce', async () => {
    let handler = jest.fn(),
        event = Symbol();
    Emitter
    .emit(event, 'test1')
    .emit(event, 'test2')
    .historyOnce(event, handler)
    .emit(event, 'test3');
    await delay();
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith('test2', expect.any(Object));
  });
});