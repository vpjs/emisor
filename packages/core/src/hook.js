import { EmisorPluginTypeError } from './plugin';
import { isSymbol, isString, isRegExp, isFunction } from './helpers';

/** @typedef {import('./').EmisorEvent} EmisorEvent */
/** @typedef {import('./').EmisorEventObject} EmisorEventObject */

/**
 * @typedef {object} EmisorHookMeta
 * @prop {EmisorEventObject} meta.event
 * @prop {*} [meta.payload]
 * @prop {object} meta.storage
 * @prop {*} [meta.options]
 */

/**
 * @callback EmisorHookCallback
 * @param {EmisorHookMeta} meta
 * @param {import('./').EmisorHookAPI} Emisor
 * @returns {object}
 */

/**
 * @callback EmisorHookFnc
 * @param {EmisorEventObject} event
 * @param {*} [payload]
 * @return {EmisorHookCallback}
 */


export class EmisorHook {
  /**
   * @type {Map<string|Symbol, EmisorHookCallback>}
   */
  #keyCallbacks = new Map();

  /**
   * @type {Set<EmisorHookCallback>}
   */
  #allCallbacks = new Set();



  get pluginApi () {
    return {
      /**
       * Register a hook based on a key
       * @param {string|Symbol} key
       * @param {EmisorHookCallback} callback 
       */
      key: (key, callback) => {
        if (!isString(key) && !isSymbol(key)) {
          throw new EmisorPluginTypeError('key', 'string or Symbol', key);
        }
        if (!isFunction(callback)) {
          throw new EmisorPluginTypeError('callback', 'function', callback);
        }
        this.#keyCallbacks.set(key, callback);
      },
      /**
       * Register a hook all events
       * @param {EmisorHookCallback} callback 
       */
      all: (callback) => {
        this.#allCallbacks.add(callback);
      } 
    };
  }


  /**
   * 
   * @param {import('./').EmisorHookAPI} Emisor
   * @returns {EmisorHookFnc[]}
   */
  getAllHooks (Emisor) {
    return Array.from(this.#allCallbacks)
      .map((callback) => {
        let  storage = {};
        return (event, payload) => callback({
          event,
          payload,
          storage
        }, Emisor);
      });
  }

  /**
   * @param {object} options 
   * @param {import('./').EmisorHookAPI} Emisor
   * @returns {EmisorHookFnc[]}
   */
  getOptionHooks (options, Emisor) {
    return Object.entries(options)
      .filter(([key]) => this.#keyCallbacks.has(key))
      .map(([key, $options]) => {
        let storage = {};
        /**
         * @param {import('./').EmisorEvent} event
         * @param {*} [payload]
         * @returns {EmisorHookCallBack}
         */
        return (event, payload) => this.#keyCallbacks.get(key)({
          storage,
          payload,
          options: $options,
          event
        }, Emisor);
      });
  }
}

/**
 * @callback EmisorHookEventStrCallBack
 * @param {string} $event
 * @return {Object<string|Symbol, any>}
 */

export class EmisorHookEventStr {
  /**
   * @type {string}
   */
  #postfixSeparator

  /**
   * @type {Map<RegExp, EmisorHookEventStrCallBack>}
   */
  #postfixCallbacks = new Map();

  /**
   * @param {string} s
   */
  set postfixSeparator(s) {
    if (isString(s) && s.length === 1) {
      this.#postfixSeparator = s;
    }
  }

  get pluginApi () {
    return {
      /**
       * Register a postfix handler
       * @param {RegExp} regex
       * @param {EmisorHookEventStrCallBack} callback
       */
      postfix: (regex, callback) => {
        if (!isRegExp(regex)) {
          throw new EmisorPluginTypeError('regex', 'RegExp', regex);
        }
        if (!isFunction(callback)) {
          throw new EmisorPluginTypeError('callback', 'function', callback);
        }
        this.#postfixCallbacks.set(regex, callback);
      }
    };
  }

  /**
   * 
   * @param {string} event 
   * @return {{event:string, options: Object<string|Symbol, any>}}
   */
  parseStr (event) {
    return this.#postfixStr(event);
  }

  /**
   * 
   * @param {string} rawEvent 
   * @return {{event:string, options: Object<string|Symbol, any>}}
   */
  #postfixStr (rawEvent) {
    let options = {},
        [event, postfix] = rawEvent.split(this.#postfixSeparator);
    //only when event has a postfix
    if (postfix) {
      this.#postfixCallbacks.forEach((hook, reg) => {
        if (reg.test(postfix)) {
          options = {
            ...options,
            ...hook(postfix)
          };
        }
      });
    }
    return {
      event,
      options
    }
  }
}