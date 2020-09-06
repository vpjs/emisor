import { EmisorCore } from '@emisor/core';
import { EmisorPluginCount } from '@emisor/plugin-count';
import { EmisorPluginHistory, MODE_DEFAULT_ALLOW, MODE_DEFAULT_DENY } from '@emisor/plugin-history';

/** @typedef {import('@emisor/core').EmisorEvent} EmisorEvent */
/** @typedef {import('@emisor/core').EmisorEventHandler} EmisorEventHandler */


//history modes
export const HISTORY_MODE_DEFAULT_ALLOW = MODE_DEFAULT_ALLOW;
export const HISTORY_MODE_DEFAULT_DENY = MODE_DEFAULT_DENY;

export class Emisor extends EmisorCore {
  #historyKey;
  #countKey;
  
  /**
   * @param {import('@emisor/core').EmisorOptions} options
   * @param {object} [pluginConfig]
   */
  constructor ({
    plugins = [], 
    ...options
  } = {}, {
    history = {}, 
    count = {}
  } = {}) {
    super({
      plugins: [
        new EmisorPluginCount(count),
        new EmisorPluginHistory(history),
        ...plugins
      ],
      ...options,
      chain: [
        ...(options?.addToChain || []),
        'once',
        'many',
        'history',
        'historyOnce'
      ],
    });
    this.#historyKey = history.key || 'history';
    this.#countKey = count.key || 'count';
  }

  /**
   * @param {EmisorEvent} event
   * @param {EmisorEventHandler} handler
   */
  once (event, handler) {
    return this.on(event, handler, {
      [this.#countKey]: 1
    });
  }

  /**
   * @param {EmisorEvent} event
   * @param {number} count
   * @param {EmisorEventHandler} handler
   */
  many (event, count, handler) {
    return this.on(event, handler, {
      [this.#countKey]: count
    });
  }

  /**
   * @param {EmisorEvent} event
   * @param {number|boolean|EmisorEventHandler} length
   * @param {EmisorEventHandler} handler
   */
  history (event, length, handler) {
    if (typeof length === 'function') {
      handler = length;
      length = true;
    }
    return this.on(event, handler, {
      [this.#historyKey]: length
    });
  }

  /**
   * @param {EmisorEvent} event
   * @param {EmisorEventHandler} handler
   */
  historyOnce (event, handler) {
    return this.on(event, handler, {
      [this.#historyKey]: true ,
      [this.#countKey]: 1
    });
  }
}