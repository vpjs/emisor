//@ts-check
export * from './plugin';

/**
 * @typedef {import('./plugin').IEmisorPlugin} IEmisorPlugin
 */
/**
 * @typedef {import('./plugin').EmisorPluginHooks} EmisorPluginHooks
 */


/**
 * @typedef {object} EmisorOptions
 * @property {string} [nsSeparator] separator options
 * @property {IEmisorPlugin[]} [plugins] plugins 
 * @property {boolean} [debug] enable debugging
 */

/**
 * @typedef {string|Symbol} EmisorEvent
 */

 
/**
 * @typedef {Map<string, Set<function>>} EmisorPluginHooksMap
 */

/**
 * @typedef {Map<EmisorEventHandler, EmisorPluginHooksMap>} EmisorSubsMap
 */

/**
 * @typedef {object} EmisorEventObject
 * @property {string} id of event `1-1`
 * @property {EmisorEvent} event that triggered the handler
 * @property {EmisorEventHandler} handler
 */


/**
 * @callback EmisorEventHandler
 * @param {*} data
 * @param {EmisorEventObject} $event
 */



const DEFAULT_NS_SEPARATOR = '.';

export class EmisorCore {
  /**
   * @type {Map<EmisorEvent, EmisorSubsMap>}
   */
  #subs = new Map()

  /**
   * @type {Map<string, IEmisorPlugin>}
   */
  #plugins = new Map()

  /**
   * @type {string} namespace separator
   */
  #nsSeparator

  /**
   * 
   * @param {EmisorOptions} options 
   */
  constructor ({
    nsSeparator = DEFAULT_NS_SEPARATOR,
    plugins = []
  } = {}) {
    this.#nsSeparator = nsSeparator;
    plugins.forEach((plugin) => this.#plugins.set(plugin.key, plugin));
  }

  /**
   * Subscribe to a event
   * @param {EmisorEvent} event 
   * @param {EmisorEventHandler} handler 
   * @param {object} [options]
   * @returns {EmisorCore}
   */
  on (event, handler, options = {}) {
    if(!this.#subs.has(event)) {
      this.#subs.set(event, new Map());
    }
    this.#subs.get(event).set(handler, this.#parseOptions(options));
    return this;
  }
  /**
   * Unsubscribe
   * If no `event` is given, all subscribe will be unsubscribe 
   * if no `handler` is given all subscribe of the given `event` will be unsubscribe
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
   */
  emit (event, payload) {
    /** @type {Array<[EmisorEventHandler, EmisorPluginHooksMap]>} */
    let subs = [],
      parsedEvents = [];

    if (typeof event === 'symbol') {
      parsedEvents = [event, '*'];
    } else if (typeof event === 'string') {
      parsedEvents = event.split(this.#nsSeparator)
        .map((_, i, arr) => [...arr.slice(0,i), '*'].join(this.#nsSeparator))
        .concat(`${event}${this.#nsSeparator}*`, event)
        .reverse();
    }

    parsedEvents.forEach((event) => {
      if(this.#subs.has(event)) {
        subs = [
          ...subs,
          ...Array.from(this.#subs.get(event))
        ];
      }
    });

    subs.forEach(([handler, hooks]) => this.#handleEmit({
      event,
      handler,
      payload,
      hooks
    }));
    
    return this;
  }

  /**
   * @param {{event: EmisorEvent, handler: EmisorEventHandler, payload: any, hooks: EmisorPluginHooksMap}} param1
   */
  #handleEmit ({event, handler, payload, hooks}) {
    let $event = {
      event,
      handler,
      id: '1'
    };
    
    //before emit
    hooks.get('beforeEmit').forEach((hook) => hook($event))
    //emit
    handler(payload, $event)
    //after emit
    hooks.get('afterEmit').forEach((hook) => hook($event))
  }

  /**
   * 
   * @param {object} options 
   * @returns {EmisorPluginHooksMap}
   */
  #parseOptions (options) {
    let hooks = new Map([
        ['afterEmit', new Set()],
        ['beforeEmit', new Set()]
      ]),
      addHook = (hook, plugin, key) => {
        hooks.get(hook).add(
          plugin[hook].bind(plugin, 
            this, 
            {[key]: options[key]},
            {}
          )
        )
      };

    Object.keys(options)
    .forEach((key) => {
      if (this.#plugins.has(key)) {
        let plugin = this.#plugins.get(key);
        //add to after
        if (plugin.afterEmit) {
          addHook('afterEmit', plugin, key)
        }
        if (plugin.beforeEmit) {
          addHook('beforeEmit', plugin, key)
        }
      }
    });

    return hooks;
  }
}
