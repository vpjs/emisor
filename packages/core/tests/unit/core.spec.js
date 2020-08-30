import { EmisorCore, UNCAUGHT_EXCEPTIONS_EVENT } from '../../src/index';
import { delay } from 'test-helpers/test';
import LeakDetector from 'jest-leak-detector';

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
  });
});


describe('EmisorCore options', () => {
  test.each([
    'nsSeparator',
    'postfixSeparator'
  ])('%s should be a string and have a length of 1', (key) => {
    expect(() => {
      new EmisorCore({[key]: 0});
    }).toThrowError(`${key} has to be a string, number given`);

    expect(() => {
      new EmisorCore({[key]: 'aa'});
    }).toThrowError(`${key} has to have exactly a length of 1`);

    expect(() => {
      new EmisorCore({[key]: '*'});
    }).toThrowError(`${key} can not be * or ?`);

    expect(() => {
      new EmisorCore({[key]: '?'});
    }).toThrowError(`${key} can not be * or ?`);

    expect(() => {
      new EmisorCore({[key]: '/'});
    }).not.toThrowError();
  });

  test('nsSeparator and postfixSeparator can not have the same value', () => {
    expect(() => {
      new EmisorCore({
        nsSeparator: '/',
        postfixSeparator: '/'
      });
    }).toThrowError('nsSeparator and postfixSeparator can not be the same');
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
      id: expect.stringMatching(/\d+/),
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


describe('Check for leaks', () => {
  test('of subscriber is not leaking after calling off', async () => {
    let Emitter = new EmisorCore(),
        reference = () => {},
        detector = new LeakDetector(reference);

    Emitter
    .on('test', reference)
    .emit('test')
    .off('test');

    await delay();
    reference = null;

    expect(await detector.isLeaking()).toBe(false);
  });
});

describe('different subscriber behavior', () => {
  test('throwing a error in the subscriber should not break any part of Emisor', async () => {
    let callback = jest.fn(),
        Emitter = new EmisorCore({
          plugins: [{
            install ({afterPublish}) {
              afterPublish.all(callback);
            }
          }]
        });
    Emitter.on('error', () => {
      throw new Error();
    });

    Emitter.emit('error')
    .off();
    await delay();

    expect(callback).toBeCalled();
  });

  test('throwing a error in the subscriber result in UNCAUGHT_EXCEPTIONS_EVENT event', async () => {
    let Emitter = new EmisorCore(),
        callback = jest.fn(),
        error = new Error('test'),
        handler = () => { throw error; };

    Emitter.on('test', handler);
    Emitter.on(UNCAUGHT_EXCEPTIONS_EVENT, callback);
    Emitter.emit('test', 1);

    await delay();

    expect(callback).toBeCalledWith({
      error,
      payload: 1,
      event: expect.objectContaining({
        event: 'test',
        handler
      })
    }, expect.any(Object));
  });

  test('afterPublish hooks should wait on async subscriber', async () => {
    let callback = jest.fn(),
        Emitter = new EmisorCore({
          plugins: [{
            install ({afterPublish}) {
              afterPublish.key('a', callback);
            }
          }, {
            install ({afterPublish}) {
              afterPublish.key('b', callback);
            }
          }]
        });
    Emitter.on('error', async () => {
      await delay();
    }, {a: 'a'});
    Emitter.on('error', () => {
      return 'b';
    }, {b: 'b'});

    Emitter.emit('error')
    .off();

    await delay(25);

    expect(callback).toHaveBeenNthCalledWith(
      1, 
      expect.objectContaining({options: 'b'}),
      expect.any(Object)
    );

    expect(callback).toHaveBeenNthCalledWith(
      2, 
      expect.objectContaining({options: 'a'}),
      expect.any(Object)
    );
  });



});