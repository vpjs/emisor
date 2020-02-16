import { EmisorCore } from '@emisor/core';
import { EmisorPluginHistory, MODE_DEFAULT_DENY, MODE_DEFAULT_ALLOW } from '../../src';
import {delay} from '../../../../../helpers/test';

describe.each([
  true,
  1,
  3
])('EmisorPluginHistory default options', (history) => {
  let Emitter = new EmisorCore({
    plugins: [
      new EmisorPluginHistory()
    ]
  });
  test(`history ${history}`, async () => {
    
    let handler = jest.fn(),
      notCalled = jest.fn(),
      event = Symbol();
    Emitter.emit(event, 'test');
    Emitter.on(event, notCalled);
    Emitter.on(event, handler, {history});
    
    await delay();

    expect(handler).toBeCalledTimes(1);
    expect(notCalled).not.toBeCalled();
    expect(handler).toBeCalledWith('test', {
      event,
      handler,
      id: expect.any(String),
      time: expect.any(Number)
    });
  });
});

describe.each([
  true,
  1,
  3,
  10
])('EmisorPluginHistory maxLength', (history) => {
  let Emitter = new EmisorCore({
    plugins: [
      new EmisorPluginHistory({
        maxLength: 5
      })
    ]
  });
  test(`history ${history}`, async () => {
    let handler = jest.fn(),
      handler2 = jest.fn(),
      notCalled = jest.fn(),
      event = Symbol(),
      called = history === true || history > 5 ? 5 : history;

    for(let i = 0, max = 10; i < max; i++) {
      Emitter.emit(event, i);
    }
    Emitter.on(event, handler, {history});
    Emitter.on(event, handler2, {history});

    await delay();

    expect(handler).toBeCalledTimes(called);
    expect(notCalled).not.toBeCalled();
    for (let i = 0; i < called; i++) {
      expect(handler2).toHaveBeenNthCalledWith(i+1, 9-i, expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(i+1, 9-i, expect.any(Object));

    }
  });
});

let event_allowed = Symbol('allowed'),
  event_denied = Symbol('denied');
describe.each([
  [MODE_DEFAULT_DENY, [event_allowed], event_allowed, true],
  [MODE_DEFAULT_DENY, ['test'], 'test', true],
  [MODE_DEFAULT_DENY, ['test.*'], 'test', true],
  [MODE_DEFAULT_DENY, ['test.*'], 'test.test1.test2', true],
  [MODE_DEFAULT_ALLOW, [event_denied], event_denied, false],
  [MODE_DEFAULT_ALLOW, ['test'], 'test', false],
  [MODE_DEFAULT_ALLOW, ['test.*'], 'test', false],
  [MODE_DEFAULT_ALLOW, ['test.*'], 'test.test1.test2', false]
])('EmisorPluginHistory mode', (mode, optionEvents, event, shouldBeCalled) => {
  let Emitter = new EmisorCore({
    plugins: [
      new EmisorPluginHistory({
        mode,
        events: optionEvents
      })
    ]
  });
  test(`mode: ${String(mode)}, event: ${String(event)}`, async () => {
    let handler = jest.fn(),
      handler2 = jest.fn(),
      event2 = Symbol();

    Emitter.emit(event);
    Emitter.on(event, handler, {history: true});
    //opposite
    Emitter.emit(event2);
    Emitter.on(event2, handler2, {history: true});

    await delay();
    
    if (shouldBeCalled) {
      expect(handler).toBeCalled();
      expect(handler2).not.toBeCalled();
    } else {
      expect(handler).not.toBeCalled();
      expect(handler2).toBeCalled();
    }
  });
});
