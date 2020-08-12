import { EmisorCore } from '../../src/index';
import { delay } from 'test-helpers/test';

describe ('EmisorCore signature', () => {
  const EmisorCoreSignature = expect.objectContaining({
    on: expect.any(Function),
    off: expect.any(Function),
    emit: expect.any(Function)
  });
  test('EmisorCore signature', () => {
    expect(new EmisorCore()).toEqual(EmisorCoreSignature); 
  });

  test('EmisorCore signature when changing', () => {
    let Emitter = new EmisorCore();
    expect(Emitter.on('test', () => {})).toEqual(EmisorCoreSignature);
    expect(Emitter.off()).toEqual(EmisorCoreSignature);
    expect(Emitter.off(Symbol('non existing event'))).toEqual(EmisorCoreSignature);
    expect(Emitter.emit('test')).toEqual(EmisorCoreSignature);
    expect(Emitter.emit(Symbol())).toEqual(EmisorCoreSignature);
    //expect(Emitter.emit(1)).toEqual(EmisorCoreSignature);
  });
});

describe.each([
  ['string', 'test'],
  ['symbol', Symbol()],
])('EmisorCore using %s based event', (_, event) => {
  test('subscriber should be called at lease once', async () => {
    let Emitter = new EmisorCore(),
      sub = jest.fn(),
      data = Symbol('test');
    
    Emitter
      .on(event, sub)
      .emit(event, data);
    
    await delay();

    expect(sub).toBeCalledWith(data, {
      event,
      handler: sub,
      id: expect.any(String),
      time: expect.any(Number)
    });
  });

  test('subscriber should only be called once', async () => {
    let Emitter = new EmisorCore(),
      sub = jest.fn(),
      data = Symbol('test');
    
    Emitter
      .on(event, sub)
      .emit(event, data)
      .off(event, sub)
      .emit(event, data);

    await delay();

    expect(sub).toBeCalledTimes(1);
  });
});

describe('EmisorCore.off', ()  => {
  test('unsubscribe all subscribers', async () => {
    let Emitter = new EmisorCore(),
      sub = jest.fn(),
      symbol = Symbol();
    Emitter
      .on('test', sub)
      .on(symbol, sub)
      .on('test.1', sub)
      .off()
      .emit('test')
      .emit('symbol')
      .emit('test.1');
    
    await delay();
    expect(sub).toBeCalledTimes(0);
  });

  test('unsubscribe all event subscribers', async () => {
    let Emitter = new EmisorCore(),
      sub1 = jest.fn(),
      sub2 = jest.fn(),
      sub3 = jest.fn(),
      symbol = Symbol();

    Emitter
      .on('test', sub1)
      .on(symbol, sub2)
      .on('test', sub3)
      .off('test')
      .emit('test')
      .emit(symbol);
    
    await delay();
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(1);
    expect(sub3).toBeCalledTimes(0);
  });

  test ('unsubscribe a specific subscriber', async () => {
    let Emitter = new EmisorCore(),
      sub1 = jest.fn(),
      sub2 = jest.fn(),
      sub3 = jest.fn(),
      symbol = Symbol();
    Emitter
      .on('test', sub1)
      .on(symbol, sub2)
      .on('test', sub3)
      .off('test', sub1)
      .emit('test')
      .emit(symbol);
    
    await delay();
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(1);
    expect(sub3).toBeCalledTimes(1);
  });
});

describe.each([
  ['.', undefined],
  ['/', {nsSeparator: '/'}]
])('"%s" namespace separator', (separator, config) => {
  test('channel subscribers', async () => {
    let Emitter = new EmisorCore(config),
      sub1 = jest.fn(),
      sub2 = jest.fn(),
      subAll = jest.fn();

    Emitter
      .on('*', subAll)
      .on(`test${separator}*`, sub1)
      .on(`test${separator}test2${separator}*`, sub2)
      .emit('test')
      .emit(`test${separator}test2`) 
      .emit(`test${separator}test2${separator}test3`)
      .emit('foo')
      .emit(Symbol());

    await delay();
    expect(subAll).toBeCalledTimes(5);
    expect(sub1).toBeCalledTimes(3);
    expect(sub2).toBeCalledTimes(2);
  });
});

describe('Namespace wildcard', () => {
  test('channel subscribers', async () => {
    let Emitter = new EmisorCore(),
      sub1 = jest.fn(),
      sub2 = jest.fn(); 
    Emitter
      .on('car.*.door.open', sub1)
      .on('car.left.*.open', sub2)
      .emit('car.left.door.open')
      .emit('car.right.door.open')
      .emit('car.left.window.open');
    await delay();
    expect(sub1).toBeCalledTimes(2);
    expect(sub2).toBeCalledTimes(2);
  });
});