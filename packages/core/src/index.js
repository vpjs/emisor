import { EmisorError, EmisorTypeError } from './errors';
import { isString, isSymbol } from './helpers';
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
 * @prop {string[]} [chain] add methods to the chain api 
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

  /**
   * Hook that enables event string parsing
   */
  #eventStrHook = new EmisorHookEventStr()

  #subscriberFilterHook = new EmisorHookAll()
  
  /**
   * Validate event
   * @param {EmisorEvent} event 
   */
  #validateEvent = (event) => {
    if (!isString(event) && !isSymbol(event)) {
      throw new EmisorTypeError('event', ['string', 'symbol'], event);
    }
  }

  #chainMethods = ['on', 'emit', 'off'];
  /**
   * @type {EmisorHookAPI}
   */
  get #hookApi () {
    return {
      on: (...args) => this.on(...args),
      emit: (...args) => this.emit(...args),
      off: (...args) => this.off(...args),
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
    plugins = [],
    chain = [],
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
    this.#chainMethods = [
      ...chain,
      ...this.#chainMethods
    ],
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
        subscriberFilter: this.#subscriberFilterHook.pluginApi,
        eventStr: this.#eventStrHook.pluginApi
      }, this.#chain());
    });
  }

  /**
   * Subscribe to a event
   * @param {EmisorEvent|EmisorEvent[]} event 
   * @param {EmisorEventHandler} handler 
   * @param {object} [options]
   * @returns {EmisorChainingAPI};
   */
  on (event, handler, options = {}) {
    if (Array.isArray(event)) {
      event.forEach((e) => this.on(e, handler, options));
      return this.#chain();
    }
    //validate event
    this.#validateEvent(event);
    //string events
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
    //validate
    this.#validateEvent(event);
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
   * Emit event
   * @param {EmisorEvent} event 
   * @param {any} [payload] 
   * @param {any[]} [tags]
   * @return {EmisorChainingAPI}
   */
  emit (event, payload, tags = []) {
    //validate
    this.#validateEvent(event);
    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    return this.#chain (
      this.#runOnEmitHook(event, payload, tags)
    );
  }

  async #runOnEmitHook (event, payload, tags) {
    let {
      $event,
      $payload,
    } = await this.#runHooks({ event, tags }, payload, this.#onEmitHook.getHooks(this.#hookApi));
    //no event given or hook has killed execution
    if (!$event) {
      return;
    }
    this.#rawEmit($event.event, $payload, $event.tags);
  }

  /**
   * 
   * @param {EmisorEvent} event 
   * @param {*} [payload]
   * @param {*} [tag]
   */
  #rawEmit (event, payload, tags) {
    /** @type {Array<[EmisorEventHandler, Object]>} */
    let subs = [], 
        parsedEvents = this.#parseEvent(event),
        $event = {
          tags,
          event
        };
    //get all subscribers
    parsedEvents
    .forEach((event) => {
      if(this.#subs.has(event)) {
        subs = [
          ...subs,
          ...Array.from(this.#subs.get(event))
        ];
      }
    });

    //nothing to do
    if (!subs.length) {
      return;
    }
    let filterHooks = this.#subscriberFilterHook.getHooks(this.#hookApi);

    subs
    .filter(([handler]) => {
      for (let hook of filterHooks) {
        return hook({...$event,
          handler
        }, payload);
      }
      return true;
    })
    .forEach(([handler, options]) => this.#publish({
      event: {
        ...$event,
        handler,
        time: Date.now(),
        id: `${DEFAULT_ID_COUNTER++}`
      },
      handler,
      payload,
      options
    }));
  }

  /**
   * @param {{event: EmisorEvent, handler: EmisorEventHandler, payload: any, tag: any, options: any}} publishObj
   */
  async #publish ({event, payload, options, handler}) {
    //before emit hooks
    let {
      $event, 
      $payload
    } = await this.#runHooks(event, payload, this.#beforePublishHook.getHooks(options, this.#hookApi));

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
      //remove tag
      if (result?.[EmisorPlugin.REMOVE_TAG]) {
        $event.tags = $event.tags
        .filter((t) => t !== result[EmisorPlugin.REMOVE_TAG]);
      }
      //add tag
      if (result?.[EmisorPlugin.ADD_TAG]) {
        $event.tags.push(result[EmisorPlugin.ADD_TAG]);
      }
      //kill
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
    let methods = this.#chainMethods,
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
    if (!isString(event)) {
      return [event, '*'];
    }
    let ns = `${event}`.split(this.#nsSeparator);
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

export {
  EmisorCore,
  EmisorPlugin
};