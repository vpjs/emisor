import { EmisorCore, EmisorPlugin } from '../../src';
import { delay } from 'test-helpers/test';

describe('Plugin hook interface', () => {

  test('plugin install hook signature', () => {
    let install = jest.fn();

    new EmisorCore({
      plugins: [{
        install
      }]
    });

    expect(install).toMatchSnapshot();

  });

  test ('plugin hook API off', async () => {
    let callback = jest.fn(),
        Emitter = new EmisorCore({
          plugins: [{
            install({afterOn}) {
              afterOn.key('t', (_, HookAPI) => {
                HookAPI.off();
              });
            }
          }]
        });
    Emitter
    .on('test2', callback)
    .on('test', () => {}, {t: 1})
    .emit('test2');
    await delay();
    expect(callback).not.toBeCalled();

  });

  test ('plugin hook API on', async () => {
    let callback = jest.fn(),
        Emitter = new EmisorCore({
          plugins: [{
            install({beforeOn}) {
              beforeOn.key('t', (_, HookAPI) => {
                HookAPI.on('test2', callback);
              });
            }
          }]
        });
    Emitter
    .on('test', null, {t: 1})
    .emit('test2');
    await delay();
    expect(callback).toBeCalledTimes(1);
  });

  test ('plugin hook API emit', async () => {
    let callback = jest.fn(),
        Emitter = new EmisorCore({
          plugins: [{
            install({beforeOn}) {
              beforeOn.key('t', (_, HookAPI) => {
                HookAPI.emit('test');
              });
            }
          }]
        });
    
    Emitter
    .on('test', callback)
    .on('test1', null, {t: 1});

    await delay();
    expect(callback).toBeCalledTimes(1);
  });

  test ('plugin hook API parseEvent', async () => {
    expect.assertions(1);
    let Emitter = new EmisorCore({
      plugins: [{
        install({beforeOn}) {
          beforeOn.key('t', (_, HookAPI) => {
            let e = Symbol();
            expect(
              HookAPI.parseEvent(e)
            ).toEqual([e, '*']);
          });
        }
      }]
    });
    Emitter
    .on('test1', null, {t: 1});
  });

});

describe('eventStr hooks', () => {
  test('eventStr.postfix', () => {  
    let regexp = /<(?<test>\d+)>/, 
        postfixCallback = jest.fn(($event) => {
          let {test} = regexp.exec($event).groups;
          return {test};
        }),
        keyCallback = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install({eventStr, beforeOn}) {
          eventStr.postfix(regexp, postfixCallback); 
          beforeOn.key('test', keyCallback);
        }
      }]
    });

    Emitter.on('test?<1>', () => {});

    expect(postfixCallback).toBeCalledWith('<1>');
    expect(keyCallback).toBeCalledWith(
      expect.objectContaining({
        options: '1'
      }),
      expect.any(Object)
    );
  });
});

const HOOKS = ['beforeOn', 'afterOn', 'beforePublish', 'afterPublish', 'onEmit'].map((hook) => [
  [hook, 'all', []],
  [hook, 'key', ['t'], {t:1}]
]).flat()
.filter(([hook, method]) => `${hook}.${method}` !== 'onEmit.key');

describe.each(HOOKS)('%s.%s', (hook, method, params, options) => {

  test('of hook get called', async () => {
    
    let event = Symbol(),
        handler = () => {},
        callback = jest.fn(),
        checkOptions = options ? options.t : null;

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](...params, callback);
        }
      }]
    });

    Emitter.on(event, handler, options)
    .emit(event);

    await delay();
  
    expect(callback).toBeCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          event,
          ...(hook === 'onEmit' ? {} : {handler})
        }),
        ...checkOptions
      }),
      expect.any(Object)
    );
  });

  
  
});

describe.each(HOOKS)('%s.%s', (hook, method, params, options) => {
  test('of hook execution breaks after hook returns "BREAK_KEY"', async () => {
    let  callback2 = jest.fn(() => ({
          [EmisorPlugin.BREAK_KEY]: true
        })),
        callback1 = jest.fn(),
        callback3 = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t1'] : params),
            callback1
          );
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](...params, callback2);
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t2'] : params),
            callback3
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      () => {}, 
      options ? {
        t2: true, 
        t1: true, 
        ...options
      } : options
    ).emit('test');

    await delay();

    expect(callback1).toBeCalled();
    expect(callback2).toBeCalled();
    expect(callback3).not.toBeCalled();

  });
});

describe.each(
  HOOKS
  .filter(([hook]) => [
    'beforePublish',
    'afterPublish',
    'onEmit'
  ].includes(hook))
)('%s.%s', (hook, method, params, options) => {
  test('of payload changes after hook returns new payload via "OVERWRITE_PAYLOAD_KEY"', async () => {
    let newPayload = Symbol(),
        payload = Symbol(), 
        checkOptions = options ? options.t : null,
        handler  = jest.fn(),
        callback = jest.fn(() => ({
          [EmisorPlugin.OVERWRITE_PAYLOAD_KEY]: newPayload
        })),
        callback2 = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](...params, callback);
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t2'] : params),
            callback2
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      handler, 
      options ? { t2: true, ...options} : options
    ).emit('test', payload);

    await delay();

    expect(callback).toBeCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          event: 'test',
          ...(hook === 'onEmit' ? {} : {handler})
        }),
        payload,
        ...checkOptions
      }),
      expect.any(Object)
    );
    expect(callback2).toBeCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          event: 'test',
          ...(hook === 'onEmit' ? {} : {handler})
        }),
        payload: newPayload,
        ...checkOptions
      }),
      expect.any(Object)
    );

    expect(handler).toBeCalledWith(
      'afterPublish' === hook ? payload : newPayload,
      expect.any(Object)
    );

  });
});

describe.each(
  HOOKS
  .filter(([hook]) => [
    'beforePublish',
    'onEmit'
  ].includes(hook))
)('%s.%s', (hook, method, params, options) => {
  test('of execution of other hooks breaks and further execution emit stops after hook returns "KILL_KEY"', async () => {
    let  callback = jest.fn(() => ({
          [EmisorPlugin.KILL_KEY]: true
        })),
        callback2 = jest.fn(),
        handler  = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](...params, callback);
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t2'] : params),
            callback2
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      handler,
      options ? { t2: true, ...options} : options
    ).emit('test');

    await delay();

    expect(callback).toBeCalled();
    expect(callback2).not.toBeCalled();
    expect(handler).not.toBeCalled();
  });
});

describe.each(
  HOOKS
  .filter(([hook]) => [
    'beforePublish',
    'onEmit'
  ].includes(hook))
)('%s.%s', (hook, method, params, options) => {
  test('of tag gets added after hook returns new tag via "ADD_TAG"', async () => {
    let tag = Symbol(),
        callback = jest.fn(() => ({
          [EmisorPlugin.ADD_TAG]: tag
        })),
        callback2 = jest.fn(),
        handler  = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](...params, callback);
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t2'] : params),
            callback2
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      handler,
      options ? { t2: true, ...options} : options
    ).emit('test');

    await delay();

    expect(callback).toBeCalled();
    expect(callback2).toBeCalledWith(expect.objectContaining({
      event: expect.objectContaining({
        tags: [tag]
      })
    }), expect.any(Object));
    expect(handler).toBeCalledWith(expect.toBeNil(), expect.objectContaining({
      tags: [tag]
    }));
  });
});


describe.each(
  HOOKS
  .filter(([hook]) => [
    'beforePublish',
    'onEmit'
  ].includes(hook))
)('%s.%s', (hook, method, params, options) => {
  test('of tag gets removed after hook returns new tag via "REMOVE_TAG"', async () => {
    let tag = Symbol(),
        tag2 = 'test',
        callback = jest.fn(() => ({
          [EmisorPlugin.REMOVE_TAG]: tag
        })),
        callback2 = jest.fn(),
        handler  = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install(hookApi) {
          hookApi[hook][method](...params, callback);
        }
      }, {
        install(hookApi) {
          hookApi[hook][method](
            ...(params.length ? ['t2'] : params),
            callback2
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      handler,
      options ? { t2: true, ...options} : options
    ).emit('test', null, [tag, tag2]);

    await delay();

    expect(callback).toBeCalled();
    expect(callback2).toBeCalledWith(expect.objectContaining({
      event: expect.objectContaining({
        tags: [tag2]
      })
    }), expect.any(Object));
    expect(handler).toBeCalledWith(null, expect.objectContaining({
      tags: [tag2]
    }));
  });
});