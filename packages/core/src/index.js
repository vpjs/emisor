import { EmisorError, EmisorTypeError } from './errors';
import { isString, isSymbol, isFunction } from './helpers';
import { EmisorHook, EmisorHookAll, EmisorHookEventStr } from './hook';
import { EmisorPlugin } from './plugin';
export * as helpers from './helpers';

/**
 * @typedef {import('./hook').EmisorHookFnc} EmisorHookFnc
 */
/**
 * @typedef {import('./hook').EmisorHookMeta} EmisorHookMeta
 */
/**
 * @typedef {import('./plugin').IEmisorPlugin} IEmisorPlugin
 */

/**
 * @typedef {object} EmisorOptions
 * @prop {string} [nsSeparator='.'] namespace separator options
 * @prop {string} [postfixSeparator=':'] postfix separator
 * @prop {IEmisorPlugin[]} [plugins] plugins
 */
 
/**
 * @typedef {string|Symbol} EmisorEvent
 */

/**
  * @typedef {Object<string|number, any>} EmisorEventOptions
  */

 
/**
 * @typedef {Map<string, EmisorHookFnc[]>} EmisorPluginHooksMap
 */

/**
 * @typedef {Map<EmisorEventHandler, object>} EmisorSubsMap
 */

/**
 * @typedef {object} EmisorEventObject
 * @prop {string} [id] of event `1-1`
 * @prop {number} time unix timestamp of publish time
 * @prop {EmisorEvent} event that triggered the handler
 * @prop {EmisorEventHandler} [handler]
 * @prop {*} [tag]
 */


/**
  * @typedef {object} EmisorChainingAPI
  * @prop {EmisorCore["on"]} on
  * @prop {EmisorCore["emit"]} emit
  * @prop {EmisorCore["off"]} off
  */

/**
  * @typedef {object} EmisorHookAPI
  * @prop {EmisorCore["on"]} on
  * @prop {EmisorCore["emit"]} emit
  * @prop {EmisorCore["off"]} off
  * @prop {Function} rawEmit
  * @prop {Function} parseEvent
  */

/**
 * @callback EmisorEventHandler
 * @param {*} data
 * @param {EmisorEventObject} $event
 */

const DEFAULT_NS_SEPARATOR = '.';
const DEFAULT_POSTFIX_SEPARATOR = ',';
const DEFAULT_WILDCARD = '*';
const DEFAULT_POSTFIX_DIVIDER= '?';

let DEFAULT_ID_COUNTER = 0;


export const UNCAUGHT_EXCEPTIONS_EVENT = Symbol();

export default class EmisorCore {
  /**
   * @type {Map<EmisorEvent, EmisorSubsMap>}
   */
  #subs = new Map()

  /**
   * @type {string} namespace separator
   */
  #nsSeparator
  /**
   * Hook that will be trigger before subscribed to a event 
   */
  #beforeOnHook = new EmisorHook()
  /**
   * Hook that will be trigger after subscribed to a event 
   */
  #afterOnHook = new EmisorHook()
  /**
   * Hook that will be trigger before event publish
   */
  #beforePublishHook = new EmisorHook()
  /**
   * Hook that will be trigger after event publish
   */
  #afterPublishHook = new EmisorHook()

  /**
   * Hook that will be trigger after emit method is invoked
   */
  #onEmitHook = new EmisorHookAll()

  /**
   * Hook that will be trigger before event is unsubscribed
   */
  #beforeOffHook = new EmisorHook()
  /**
   * Hook that will be trigger after event is unsubscribed
   */
  #afterOffHook = new EmisorHook()

  #eventStrHook = new EmisorHookEventStr()

  /**
   * @type {EmisorHookAPI}
   */
  get #hookApi () {
    return {
      on: (...args) => this.on(...args),
      emit: (...args) => this.emit(...args),
      off: (...args) => this.off(...args),
      rawEmit: (...args) => this.#rawEmit(...args),
      parseEvent: (event) => this.#parseEvent(event)
    };
  }

  /**
   * 
   * @param {EmisorOptions} options 
   */
  constructor ({
    nsSeparator = DEFAULT_NS_SEPARATOR,
    postfixSeparator = DEFAULT_POSTFIX_SEPARATOR,
    plugins = []
  } = {}) {
    [
      ['nsSeparator', nsSeparator],
      ['postfixSeparator', postfixSeparator]
    ].forEach(([key, value]) => {
      if (!isString(value)) {
        throw new EmisorTypeError(key, 'string', value);
      }
      if (value.length !== 1) {
        throw new EmisorTypeError(`${key} has to have exactly a length of 1`);
      }
      if ([DEFAULT_WILDCARD, DEFAULT_POSTFIX_DIVIDER].includes(value)) {
        throw new EmisorError(`${key} can not be * or ?`);
      }
    });
    if (postfixSeparator === nsSeparator) {
      throw new EmisorError('nsSeparator and postfixSeparator can not be the same');
    }
    this.#nsSeparator = nsSeparator;
    this.#eventStrHook.postfixSeparator = postfixSeparator;
    this.#eventStrHook.postfixDivider = DEFAULT_POSTFIX_DIVIDER;

    plugins.forEach((plugin) => {
      plugin.install({
        beforeOn: this.#beforeOnHook.pluginApi,
        afterOn: this.#afterOnHook.pluginApi,
        beforePublish: this.#beforePublishHook.pluginApi,
        afterPublish: this.#afterPublishHook.pluginApi,
        beforeOff: this.#beforeOffHook.pluginApi,
        afterOff: this.#afterOffHook.pluginApi,
        onEmit: this.#onEmitHook.pluginApi,
        eventStr: this.#eventStrHook.pluginApi
      }, this.#chain());
    });
  }

  /**
   * Subscribe to a event
   * @param {EmisorEvent} event 
   * @param {EmisorEventHandler} handler 
   * @param {object} [options]
   * @returns {EmisorChainingAPI};
   */
  on (event, handler, options = {}) {
      

    if(isString(event)) {
      let result = this.#eventStrHook.parseStr(event);
      event = result.event;
      options = {
        ...result.options,
        ...options
      };
    }

    if(!this.#subs.has(event)) {
      this.#subs.set(event, new Map());
    }
    let $event = {
      event,
      handler
    };
    
    //before on hooks
    for (let hook of this.#beforeOnHook.getHooks(options, this.#hookApi)) {
      let result = hook($event);
      if (result?.[EmisorPlugin.OVERWRITE_HANDLER_KEY]) {
        handler = result[EmisorPlugin.OVERWRITE_HANDLER_KEY];
      }

      if (result?.[EmisorPlugin.BREAK_KEY]) {
        break;
      }
    }
    
    //subscribe
    this.#subs.get(event).set(handler, options);
    //after on hooks
    for (let hook of this.#afterOnHook.getHooks(options, this.#hookApi)) {
      let result = hook($event);
      if (result?.[EmisorPlugin.BREAK_KEY]) {
        break;
      }
    }
    return this.#chain();
  }
  /**
   * Unsubscribe
   * If no `event` is given, all subscribe will be unsubscribed 
   * if no `handler` is given all subscribe of the given `event` will be unsubscribed
   * @param {EmisorEvent} [event] unsubscribe to a specific event
   * @param {EmisorEventHandler} [handler] unsubscribe to a specific handler
   * @returns {EmisorChainingAPI}
   */
  off (event, handler) {
    //remove all
    if (!event) {
      this.#subs = new Map();
      return this.#chain();
    }
    let handlers = this.#subs.get(event);
    //if a event doesn't have any handlers we can don't unsubscribe anything 
    if(!handlers) {
      return this.#chain();
    }
    //remove all handlers of event
    if (!handler) {
      handlers.clear();
    } else {
      handlers.delete(handler);
    }
    return this.#chain();
  }

  /**
   * 
   * @param {EmisorEvent} event 
   * @param {*} [payload] 
   * @return {EmisorChainingAPI}
   */
  emit (event, payload) {
    return this.#chain (
      this.#runOnEmitHook(event, payload)
    );
  }

  async #runOnEmitHook (event, payload) {
    let {
      $event,
      $payload
    } = await this.#runHooks({ event}, payload, this.#onEmitHook.getHooks(this.#hookApi));
    //no event given or hook has killed execution
    if (!$event) {
      return;
    }
    this.#rawEmit($event.event, $payload);
  }

  /**
   * 
   * @param {EmisorEvent} event 
   * @param {*} [payload]
   * @param {EmisorEventHandler|EmisorEventHandler[]} [only]
   * @param {*} [tag]
   */
  async #rawEmit (event, payload, only, tags) {
    /** @type {Array<[EmisorEventHandler, EmisorPluginHooksMap]>} */
    let subs = [], 
        parsedEvents = this.#parseEvent(event),
        $event = {
          tags,
          event
        };
    
    // {generator: filterHooks, updateEvent} = this.#hooksGeneratorInit({}, payload, [
    //   () => only ? /** @type {EmisorEventHandler[]} **/ (only).includes(handler) : true
    // ]);
    //before emit
    only = /** @type {EmisorEventHandler[]} **/ (isFunction(only) ? [only] : only);
    parsedEvents.forEach((event) => {
      if(this.#subs.has(event)) {
        subs = [
          ...subs,
          ...Array.from(this.#subs.get(event))
        ];
      }
    });
    // let handlerIndex = 0
    // updateEvent({
    //   ...$event,
    //   handler: subs[++handlerIndex]
    // })
    // for await (let filter of filterHooks) {
    //   for 
    // }


    subs
    .filter(([handler]) => only ? /** @type {EmisorEventHandler[]} **/ (only).includes(handler) : true)
    .forEach(([handler, options]) => this.#publish({
      event: {
        ...$event,
        handler,
        time: Date.now(),
        id: `${DEFAULT_ID_COUNTER++}`
      },
      payload,
      options
    }));
  }

  /**
   * @param {{event: EmisorEvent, handler: EmisorEventHandler, payload: any, tag: any, options: any}} publishObj
   */
  async #publish ({event, payload, options}) {
    //before emit hooks
    let {
          $event, 
          $payload
        } = await this.#runHooks(event, payload, this.#beforePublishHook.getHooks(options, this.#hookApi)),
        { handler } = $event;

    //no event given or hook has killed execution
    if (!$event) {
      return;
    }

    //publish
    try {
      await handler($payload, $event);
    } catch (error) {
      this.#rawEmit(UNCAUGHT_EXCEPTIONS_EVENT, {
        error,
        event: $event,
        payload: $payload
      });
    } 
    //after emit hooks
    await this.#runHooks($event, payload,  this.#afterPublishHook.getHooks(options,this.#hookApi));
  }

  async #runHooks ($event, $payload, hooks) {
    for (let hook of hooks) {
      let result = await hook($event, $payload);
      //update payload
      if (result?.[EmisorPlugin.OVERWRITE_PAYLOAD_KEY]) {
        $payload = result[EmisorPlugin.OVERWRITE_PAYLOAD_KEY];
      }
      if (result?.[EmisorPlugin.KILL_KEY]) {
        return {};
      }
      //break
      if (result?.[EmisorPlugin.BREAK_KEY]) {
        break;
      }
    }
    return {$payload, $event};
  }

  /**
   * Emisor chain, that is also promise aware
   * @param {Promise} [promise]
   * @returns {EmisorChainingAPI}
   */
  #chain (promise) {
    let methods = ['on', 'emit', 'off'],
        wrappers ;
    if (!promise) {
      wrappers = methods.map((key) => [
        key,
        (...args) => this[key](...args)
      ]);
    } else {
      wrappers = methods.map((key) => [
        key,
        (...args) => {
          promise.finally(() => this[key](...args));
          return this.#chain(promise);
        }
      ]);
    }
    return Object.fromEntries(wrappers);
  }

  /**
   * @param {EmisorEvent} event
   * @returns {EmisorEvent[]} 
   */
  #parseEvent (event) {
    if (isSymbol(event)) {
      return [event, '*'];
    } else if (isString(event)) { 
      let ns = /** @type {string} **/ (event).split(this.#nsSeparator);
      return [
        event,
        `${event}${this.#nsSeparator}${DEFAULT_WILDCARD}`,
        ...ns.map((_, i, arr) => {
          let x = [...arr];
          x[i] = DEFAULT_WILDCARD;
          return [
            x.join(this.#nsSeparator),
            [...arr.slice(0,i), DEFAULT_WILDCARD].join(this.#nsSeparator)
          ];
        }).flat()
      ].filter((v, i, a) => a.indexOf(v) === i);
    }
  }

}

export {
  EmisorCore,
  EmisorPlugin
};