import { EmisorCore, EmisorPlugin } from '../../src';

describe('Plugin hook interface', () => {

  test('plugin install hook signature', () => {
    let install = jest.fn();
    class Plugin extends EmisorPlugin {
      install = install
    }

    new EmisorCore({
      plugins: [
        new Plugin
      ]
    });

    expect(install).toMatchSnapshot();

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
    class Plugin extends EmisorPlugin {
      install({eventStr, beforeOn}) {
        eventStr.postfix(regexp, postfixCallback); 
        beforeOn.key('test', keyCallback);
      }
    }
    const Emitter = new EmisorCore({
      plugins: [
        new Plugin
      ]
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

describe.each([
  ['all', []],
  ['key', ['t'], {t:1}],
])('beforeOn hooks', (method, params, options) => {
  test (`beforeOn.${method}`, () => {
    let event = Symbol(),
        handler = () => {},
        callback = jest.fn(),
        checkOptions = options ? options.t : null;

    const Emitter = new EmisorCore({
      plugins: [{
        install({beforeOn}) {
          beforeOn[method](...params, callback);
        }
      }]
    });

    Emitter.on(event, handler, options);

    expect(callback).toBeCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          event,
          handler
        }),
        ...checkOptions
      }),
      expect.any(Object)
    );
  });

  test (`beforeOn.${method} break`, () => {
    let  callback = jest.fn(() => ({
          [EmisorPlugin.BREAK_KEY]: true
        })),
        callback2 = jest.fn();

    const Emitter = new EmisorCore({
      plugins: [{
        install({beforeOn}) {
          beforeOn[method](...params, callback);
        }
      }, {
        install({beforeOn}) {
          beforeOn[method](
            ...(params.length ? ['t2'] : params),
            callback2
          );
        }
      }]
    });

    Emitter.on(
      'test', 
      () => {}, 
      options ? { t2: true, ...options} : options
    );

    expect(callback).toBeCalled();
    expect(callback2).not.toBeCalled();

  });
});