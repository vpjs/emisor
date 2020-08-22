import { isString, isSymbol, isFunction } from './helpers';
import { EmisorHook, EmisorHookEventStr } from './hook';
export * as helpers from './helpers';
export * from './plugin';

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
 * @typedef {Map<EmisorEventHandler, EmisorPluginHooksMap>} EmisorSubsMap
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
const DEFAULT_POSTFIX_SEPARATOR = ':';


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
   * Hook that will be trigger before event emit
   */
  #beforeEmitHook = new EmisorHook()
  /**
   * Hook that will be trigger after event emit
   */
  #afterEmitHook = new EmisorHook()
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
    }
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
    this.#nsSeparator = nsSeparator;
    this.#eventStrHook.postfixSeparator = postfixSeparator;

    plugins.forEach((plugin) => {
      plugin.install({
        beforeOn: this.#beforeOnHook.pluginApi,
        afterOn: this.#afterOnHook.pluginApi,
        beforeEmit: this.#beforeEmitHook.pluginApi,
        afterEmit: this.#afterEmitHook.pluginApi,
        beforeOff: this.#beforeOffHook.pluginApi,
        afterOff: this.#afterOffHook.pluginApi,
        eventStr: this.#eventStrHook.pluginApi
      });
    });
  }

  /**
   * Subscribe to a event
   * @param {EmisorEvent} event 
   * @param {EmisorEventHandler} handler 
   * @param {object} [options]
   */
  on (event, handler, options = {}) {
      

    if(isString(event)) {
      let result = this.#eventStrHook.parseStr(/** @type {string}*/ (event));
      event = result.event;
      options = {
        ...result.options,
        ...options
      };
    }

    if(!this.#subs.has(event)) {
      this.#subs.set(event, new Map());
    }
    let beforeOn = [
        ...this.#beforeOnHook.getOptionHooks(options, this.#hookApi),
        ...this.#beforeOnHook.getAllHooks(this.#hookApi)
      ],
      afterOn = [
        ...this.#afterOnHook.getOptionHooks(options, this.#hookApi),
        ...this.#afterOnHook.getAllHooks(this.#hookApi)
      ],
      $event = {
        time: Date.now(),
        event,
        handler
      };
    
    //before on hooks
    beforeOn.forEach((hook) => {
      let {handler: overwriteHandler} = hook($event) || {};
      if (overwriteHandler) {
        handler = overwriteHandler;
      }
    });
    
    //subscribe
    this.#subs.get(event).set(handler, new Map([
      ['beforeEmit', this.#beforeEmitHook.getOptionHooks(options, this.#hookApi)],
      ['afterEmit', this.#afterEmitHook.getOptionHooks(options, this.#hookApi)],
      ['beforeOff', this.#beforeOffHook.getOptionHooks(options, this.#hookApi)],
      ['afterOff', this.#afterOffHook.getOptionHooks(options, this.#hookApi)]
    ]));
    //after on hooks
    afterOn.forEach((hook) => hook($event));

    return this;
  }
  /**
   * Unsubscribe
   * If no `event` is given, all subscribe will be unsubscribed 
   * if no `handler` is given all subscribe of the given `event` will be unsubscribed
   * @param {EmisorEvent} [event] unsubscribe to a specific event
   * @param {EmisorEventHandler} [handler] unsubscribe to a specific handler
   */
  off (event, handler) {
    //remove all
    if (!event) {
      this.#subs = new Map();
      return this;
    }
    let handlers = this.#subs.get(event);
    //if a event doesn't have any handlers we can don't unsubscribe anything 
    if(!handlers) {
      return this;
    }
    //remove all handlers of event
    if (!handler) {
      handlers.clear();
    } else {
      handlers.delete(handler);
    }
    return this;
  }

  /**
   * 
   * @param {EmisorEvent} event 
   * @param {*} [payload] 
   * @return {EmisorChainingAPI}
   */
  emit (event, payload) {
    this.#rawEmit(event, payload);
    return this;
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
        `${event}${this.#nsSeparator}*`,
        ...ns.map((_, i, arr) => {
          let x = [...arr];
          x[i] = '*';
          return [
            x.join(this.#nsSeparator),
            [...arr.slice(0,i), '*'].join(this.#nsSeparator)
          ]
        }).flat()
      ].filter((v, i, a) => a.indexOf(v) === i)
    }
  }

  /**
   * 
   * @param {EmisorEvent} event 
   * @param {*} [payload]
   * @param {EmisorEventHandler|EmisorEventHandler[]} [only]
   * @param {*} [tag]
   */
  async #rawEmit (event, payload, only, tag) {
    /** @type {Array<[EmisorEventHandler, EmisorPluginHooksMap]>} */
    let subs = [], 
      parsedEvents = this.#parseEvent(event);
    only = /** @type {EmisorEventHandler[]} **/ (isFunction(only) ? [only] : only);
    parsedEvents.forEach((event) => {
      if(this.#subs.has(event)) {
        subs = [
          ...subs,
          ...Array.from(this.#subs.get(event))
          .filter(([handler]) => only ? /** @type {EmisorEventHandler[]} **/ (only).includes(handler) : true)
        ];
      }
    });

    if (subs.length === 0) {
      this.#beforeEmitHook.getAllHooks(this.#hookApi)
      .forEach((hook) => hook({
        event,
        time: Date.now(),
        tag
      }, payload));
    }
    subs.map(([handler, hooks]) => Promise.resolve({
      event,
      tag,
      handler,
      payload,
      hooks
    }))
    .forEach((p) => p.then((d) => this.#publish(d)));
  }

  /**
   * @param {{event: EmisorEvent, handler: EmisorEventHandler, payload: any, tag: any, hooks: EmisorPluginHooksMap}} param1
   */
  #publish ({event, handler, payload, hooks, tag}) {
    let $event = {
      event,
      handler,
      time: Date.now(),
      id: '1',
      tag
    };
    //before emit hooks
    [
      ...hooks.get('beforeEmit'),
      ...this.#beforeEmitHook.getAllHooks(this.#hookApi)
    ].forEach((hook) => hook($event, payload));
    //emit
    handler(payload, $event);
    //after emit hooks
    [
      ...hooks.get('afterEmit'),
      ...this.#afterEmitHook.getAllHooks(this.#hookApi)
    ].forEach((hook) => hook($event, payload));
  }
}

export {
  EmisorCore
}