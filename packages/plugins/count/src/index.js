import { EmisorPlugin } from '@emisor/core';

/**
 * @typedef {import("@emisor/core").IEmisorPlugin} IEmisorPlugin
 */

const COUNT = Symbol();
const DEFAULT_KEY = 'count';
const POSTFIX_ON_KEY = /#(?<count>[1-9]\d*)/;

/**
 * @implements {IEmisorPlugin}
 */
export class EmisorPluginCount extends EmisorPlugin {
  #key

  /**
   * @param {object} [options]
   * @param {string} [options.key='count']
   */
  constructor ({key = DEFAULT_KEY} = {}) { 
    super();
    this.#key = key;
  }

  /**
   * @param {import('@emisor/core').EmisorPluginHook} hook 
   */
  install(hook) {
    hook.eventStr.postfix(POSTFIX_ON_KEY, ($event) =>  {
      let {count} = POSTFIX_ON_KEY.exec($event).groups;
      return {count};
    });
    hook.beforeOn.key(
      this.#key,
      (...args) => this.#beforeOn(...args)
    );
  }

  /**
   * 
   * @param {import('@emisor/core').EmisorHookMeta} meta
   * @param {import('@emisor/core').EmisorHookAPI} Emisor 
   */
  #beforeOn ({event: {handler}, options}, Emisor) {
    if (options > 0) {
      let count = options;
      return {
        /**
         * @type {import('@emisor/core').EmisorEventHandler}
         */
        handler: (data, $event) => {
          if (count === 1) {
            Emisor.off($event.event, $event.handler);
          }
          if (count) {
            handler(data, $event);
            count--;
          }
        }
      }
    }
  }
}