import { EmisorHookAll, EmisorHook, EmisorHookEventStr  } from '../../src/hook';

describe ('EmisorHookAll', () => {
  test('plugin interface', () => {
    let hook = new EmisorHookAll();
    expect(hook).toHaveProperty('pluginApi', {
      all: expect.any(Function)
    });
    expect(hook).toHaveProperty('getHooks', expect.any(Function));
  });

  test('EmisorHookAll pluginApi.all only accepts a functions', () => {
    let hook = new EmisorHookAll();

    ['',1,null, undefined, {}]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.all(type);
      }).toThrowError(`callback has to be a function, ${typeof type} given`);
    });

    expect(() => {
      hook.pluginApi.all(() => {});
    }).not.toThrowError();
  });

  test('EmisorHookAll.getAllHooks returns early registered callback', () => {
    let hook = new EmisorHookAll(),
        callback = jest.fn(),
        Emisor = {},
        event = Symbol(),
        payload = Symbol();
      
    hook.pluginApi.all(callback);

    let allHooks = hook.getHooks(Emisor);

    allHooks.forEach((hook) => hook(event, payload));

    expect(callback).toBeCalledWith({
      event,
      payload,
      storage: expect.any(Object)
    }, Emisor);

  });
  
});


describe ('EmisorHook', () => {
  test('plugin interface', () => {
    let hook = new EmisorHook();
    expect(hook).toHaveProperty('pluginApi', {
      all: expect.any(Function),
      key:expect.any(Function)
    });
    expect(hook).toHaveProperty('getHooks', expect.any(Function));
    expect(hook).toHaveProperty('getHooks', expect.any(Function));
  });

  test('EmisorHook pluginApi.key should throw a error when first param is not an string or a Symbol', () => {
    let hook = new EmisorHook();
    [1,null, undefined, {}, () => {}]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.key(type, () => {});
      }).toThrowError(`key has to be a string or Symbol, ${typeof type} given`);
    });
  });

  test('EmisorHook pluginApi.key should throw a error when seconds param is not an function', () => {
    let hook = new EmisorHook();
    ['',1,null, undefined, {}, /a/]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.key('a', type);
      }).toThrowError(`callback has to be a function, ${typeof type} given`);
    });
  });

  test('EmisorHook pluginApi.all should throw a error when first param is not an function', () => {
    let hook = new EmisorHook();
    ['',1,null, undefined, {}, /a/]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.all(type);
      }).toThrowError(`callback has to be a function, ${typeof type} given`);
    });
  });

  test('EmisorHook pluginApi.key should not throw a error when string/Symbol and function is given as params', () => {
    let hook = new EmisorHook();
    expect(() => {
      hook.pluginApi.key('a', () => {});
    }).not.toThrowError();

    expect(() => {
      hook.pluginApi.key(Symbol(), () => {});
    }).not.toThrowError();
  });

  test('EmisorHookAll.getHooks returns early registered callback with given option key', () => {
    let hook = new EmisorHook(),
        callback = jest.fn(),
        Emisor = {},
        event = Symbol(),
        payload = Symbol();
      
    hook.pluginApi.key('test', callback);

    let allHooks = hook.getHooks({test: 1}, Emisor);

    allHooks.forEach((hook) => hook(event, payload));

    expect(callback).toBeCalledWith({
      event,
      payload,
      options: 1,
      storage: expect.any(Object)
    }, Emisor);
  });

  test('EmisorHookAll.getHooks returns empty result when key doesn\'t exists in options', () => {
    let hook = new EmisorHook(),
        callback = jest.fn();
    hook.pluginApi.key('test', callback);

    let allHooks = hook.getHooks({test2: 1}, {});

    allHooks.forEach((hook) => hook('foo', 'bar'));

    expect(allHooks).toEqual([]);
    expect(callback).not.toBeCalled();

  });

  test('EmisorHookAll.getHooks should return hook in the same order as they are registered', () => {
    let hook = new EmisorHook(),
        callback1 = () => 1,
        callback2 = () => 2,
        callback3 = () => 3,
        callback4 = () => 4;

    hook.pluginApi.key('a', callback1);
    hook.pluginApi.all(callback2);
    hook.pluginApi.key('b', callback3);
    hook.pluginApi.all(callback4);

    let result = hook.getHooks({a: 1, b: 2}).map((hook) => hook());
    
    expect(result).toEqual([1,2,3,4]);
    
  });

  
});


describe ('EmisorHookEventStr', () => {
  test('plugin interface', () => {
    let hook = new EmisorHookEventStr();
    expect(hook).toHaveProperty('pluginApi', {
      postfix: expect.any(Function),
      prefix: expect.any(Function)
    });
    expect(hook).toHaveProperty('parseStr', expect.any(Function));
  });

  test('EmisorHookEventStr pluginApi.postfix should throw a error when first param is not an RegExp', () => {
    let hook = new EmisorHookEventStr();
    ['',1,null, undefined, {}, () => {}]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.postfix(type, () => {});
      }).toThrowError(`regex has to be a RegExp, ${typeof type} given`);
    });
  });

  test('EmisorHookEventStr pluginApi.postfix should throw a error when seconds param is not an function', () => {
    let hook = new EmisorHookEventStr();
    ['',1,null, undefined, {}, /a/]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.postfix(/a/, type);
      }).toThrowError(`callback has to be a function, ${typeof type} given`);
    });
  });

  test('EmisorHookEventStr pluginApi.postfix should not throw a error when RegExp and function is given as params', () => {
    let hook = new EmisorHookEventStr();
    expect(() => {
      hook.pluginApi.postfix(/a/, () => {});
    }).not.toThrowError();
  });

  test('EmisorHookEventStr parseStr should call registered callback with given postfix', () => {
    let hook = new EmisorHookEventStr(),
        callback1 = jest.fn(() => ({
          test: 1
        })),
        callback2 = jest.fn(() => ({
          test2: 1
        }));


    hook.postfixDivider = '?';
    hook.postfixSeparator = ',';

    hook.pluginApi.postfix(/1/, callback1);
    hook.pluginApi.postfix(/a/, callback2);
    hook.pluginApi.postfix(/x/, () => {});

    expect(hook.parseStr('test?1')).toEqual({
      event: 'test',
      options: {
        test: 1
      }
    });

    expect(hook.parseStr('test?1,a')).toEqual({
      event: 'test',
      options: {
        test: 1,
        test2: 1
      }
    });

    expect(hook.parseStr('test?x')).toEqual({
      event: 'test',
      options: {}
    });

    expect(callback1).toHaveBeenNthCalledWith(1, '1');
    expect(callback1).toHaveBeenNthCalledWith(2, '1');
    expect(callback2).toBeCalledWith('a');

  });


  test('EmisorHookEventStr parseStr should strip off the postfix party even if there is no match', () => {
    let hook = new EmisorHookEventStr();
    hook.postfixDivider = '?';
    hook.postfixSeparator = ',';
    expect(hook.parseStr('test?1')).toEqual({
      event: 'test',
      options: {}
    });
  });


  test('EmisorHookEventStr pluginApi.prefix should throw a error when first param is not an string', () => {
    let hook = new EmisorHookEventStr();
    [1,null, undefined, {}, () => {}]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.prefix(type, () => {});
      }).toThrowError(`char has to be a string, ${typeof type} given`);
    });
  });

  test('EmisorHookEventStr pluginApi.prefix should throw a error when first param is a "a-z" or "0-9"', () => {
    let hook = new EmisorHookEventStr();
    ['a','1']
    .forEach((char) => {
      expect(() => {
        hook.pluginApi.prefix(char, () => {});
      }).toThrowError(`char "${char}" is not allowed`);
    });
  });

  test('EmisorHookEventStr pluginApi.prefix should throw when first param is a string that is longer then 1', () => {
    let hook = new EmisorHookEventStr();
    ['abc']
    .forEach((char) => {
      expect(() => {
        hook.pluginApi.prefix(char, () => {});
      }).toThrowError('char can not be longer then 1');
    });
  });

  test('EmisorHookEventStr pluginApi.prefix should throw a error when there is already a hook registered with the same char', () => {
    let hook = new EmisorHookEventStr();
    hook.pluginApi.prefix('!', () => {});
    
    expect(() => {
      hook.pluginApi.prefix('!', () => {});
    }).toThrowError('There is already a hook registered with "!"');
  });

  test('EmisorHookEventStr pluginApi.prefix should throw a error when seconds param is not an function', () => {
    let hook = new EmisorHookEventStr();
    ['',1,null, undefined, {}, /a/]
    .forEach((type) => {
      expect(() => {
        hook.pluginApi.prefix('!', type);
      }).toThrowError(`callback has to be a function, ${typeof type} given`);
    });
  });

  test('EmisorHookEventStr pluginApi.prefix should throw a error when first param is equal to "postfixSeparator" or "postfixDivider"', () => {
    let hook = new EmisorHookEventStr();
    hook.postfixDivider = '?';
    hook.postfixSeparator = ',';
    ['?',',']
    .forEach((char) => {
      expect(() => {
        hook.pluginApi.prefix(char, () => {});
      }).toThrowError(`char "${char}" is not allowed`);
    });
  });

  test('EmisorHookEventStr parseStr should call registered callback with given prefix', () => {
    let hook = new EmisorHookEventStr(),
        callback = jest.fn(() => ({
          test: '!'
        }));

    hook.postfixDivider = '?';
    hook.postfixSeparator = ',';

    hook.pluginApi.prefix('!', callback);

    let result = hook.parseStr('!test');

    expect(callback).toBeCalledWith('!');
    expect(result).toEqual({
      event: 'test',
      options: {
        test: '!'
      }
    });

  });

});
