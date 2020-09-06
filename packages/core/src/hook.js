import { EmisorPluginTypeError, EmisorPluginError } from './errors';
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

export class EmisorHookAll {
  /**
   * @type {Set<EmisorHookCallback>}
   */
  #allCallbacks = new Set();

  get pluginApi () {
    return {
      /**
       * Register a hook all events
       * @param {EmisorHookCallback} callback 
       */
      all: (callback) => {
        if (!isFunction(callback)) {
          throw new EmisorPluginTypeError('callback', 'function', callback);
        }
        this.#allCallbacks.add(callback);
      } 
    };
  }

  /**
   * 
   * @param {import('./').EmisorHookAPI} Emisor
   * @returns {EmisorHookFnc[]}
   */
  getHooks (Emisor) {
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
}



export class EmisorHook  {
  #index = 0
  /**
   * @type {Map<string|Symbol|{all: true}, EmisorHookCallback>}
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
        this.#keyCallbacks.set(key, {
          callback,
          index: this.#index++
        });
      },
      /**
       * Register a hook all events
       * @param {EmisorHookCallback} callback 
       */
      all: (callback) => {
        if (!isFunction(callback)) {
          throw new EmisorPluginTypeError('callback', 'function', callback);
        }
        this.#allCallbacks.add({
          callback,
          index: this.#index++
        });
      }
    };
  }

  /**
   * @param {object} options 
   * @param {import('./').EmisorHookAPI} Emisor
   * @returns {EmisorHookFnc[]}
   */
  getHooks (options, Emisor) {
    return Object.entries(options)
    .filter(([key]) => this.#keyCallbacks.has(key))
    .map(([key, $options]) => ({
      ...this.#keyCallbacks.get(key),
      $options
    }))
    //add "all" callbacks
    .concat([...this.#allCallbacks])
    //sort
    .sort(({index: a}, {index: b}) => a -  b)
    ///create hooks
    .map(({callback, $options}) => {
      let storage = {};
      /**
         * @param {import('./').EmisorEvent} event
         * @param {*} [payload]
         * @returns {EmisorHookCallBack}
         */
      return (event, payload) => callback({
        storage,
        payload,
        event,
        ...($options ? {options:  $options} : null)
      }, Emisor);

    });
  }
}

const PREFIX_ALLOWED = '<>[]{}()/\\:;.,\'"-=+~*^!@#$%&?_`';

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
   * @type {RegExp}
   */
  #allowedPrefixRegex

  /**
   * @type {string}
   */
  #postfixDivider

  /**
   * @type {Map<RegExp, EmisorHookEventStrCallBack>}
   */
  #postfixCallbacks = new Map();

  /**
   * @type {Map<RegExp, EmisorHookEventStrCallBack>}
   */
  #prefixCallbacks = new Map();

  /**
   * @param {string} s
   */
  set postfixSeparator(s) {
    if (!isString(s)) {
      throw new EmisorPluginTypeError('postfixSeparator', 'string', s);
    }
    if(s.length !== 1) {
      throw new EmisorPluginError('postfixSeparator can not be longer then 1');
    }
    
    this.#postfixSeparator = s;
    this.#updateAllowedPrefixRegex();
    
  }

  /**
   * @param {string} s
   */
  set postfixDivider(s) {
    if (!isString(s)) {
      throw new EmisorPluginTypeError('postfixDivider', 'string', s);
    }
    if(s.length !== 1) {
      throw new EmisorPluginError('postfixDivider can not be longer then 1');
    }
    this.#postfixDivider = s;
    this.#updateAllowedPrefixRegex();
  }

  get pluginApi () {
    return {
      /**
       * Register a postfix hook
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
      },

      /**
       * Register a prefix hook
       * @param {string} char any char that is not a-z, 0-9 or postfix separator
       * @param {EmisorHookEventStrCallBack} callback
       */
      prefix: (char, callback) => {
        if (!isString(char)) {
          throw new EmisorPluginTypeError('char', 'string', char);
        }
        if (char.length !== 1) {
          throw new EmisorPluginError('char can not be longer then 1');
        }
        if (!this.#allowedPrefixRegex.test(char)) {
          throw new EmisorPluginError(`char "${char}" is not allowed`);
        }
        if (!isFunction(callback)) {
          throw new EmisorPluginTypeError('callback', 'function', callback);
        }
        if (this.#prefixCallbacks.has(char)) {
          throw new EmisorPluginError(`There is already a hook registered with "${char}"`);
        }
        this.#prefixCallbacks.set(char, callback);
      }
    };
  }

  constructor () {
    this.#updateAllowedPrefixRegex();
  }

  /**
   * Parse event string
   * @param {string} event 
   * @return {{event:string, options: Object<string|Symbol, any>}}
   */
  parseStr (event) {
    let postfix = this.#postfixStr(event),
        prefix = this.#prefixStr(postfix.event);
    return {
      event: prefix.event,
      options: {
        ...postfix.options,
        ...prefix.options
      }
    };
  }

  /**
   * Parse prefix string and runs prefix hooks if any
   * @param {string} rawEvent 
   * @return {{event:string, options: Object<string|Symbol, any>}}
   */
  #prefixStr (rawEvent) {
    let char = rawEvent[0],
        hook = this.#prefixCallbacks.get(char);
    //run hook
    if (hook) {
      return {
        event: rawEvent.substr(1),
        options: {
          ...hook(char)
        }
      };
    }
    return {
      event: rawEvent,
      options: {}
    };
  }

  /**
   * Parse postfix string and runs postfix hooks if any
   * @param {string} rawEvent 
   * @return {{event:string, options: Object<string|Symbol, any>}}
   */
  #postfixStr (rawEvent) {
    let options = {},
        [event, ...postfix] = rawEvent.split(this.#postfixDivider);
    postfix = postfix.join(this.#postfixDivider);
    //only when event has a postfix
    if (postfix) {
      postfix.split(this.#postfixSeparator)
      .forEach((plugin) => {
        this.#postfixCallbacks.forEach((hook, reg) => {
          if (reg.test(plugin)) {
            options = {
              ...options,
              ...hook(plugin)
            };
          }
        });
      });
      
    }
    return {
      event,
      options
    };
  }

  /**
   * update allowed prefix regex
   */
  #updateAllowedPrefixRegex () {
    let needsEscaping = [
          '-',
          ']'
        ],
        disallowed = [
          this.#postfixDivider,
          this.#postfixSeparator,
          '*' //wild card
        ],
        allowed = PREFIX_ALLOWED.split('')
        .filter((char) => !disallowed.includes(char))
        .map((char) => {
          if (needsEscaping.includes(char)) {
            return `\\${char}`;
          }
          return char;
        })
        .join('');
    this.#allowedPrefixRegex = new RegExp(`[${allowed}]`);
  }
}