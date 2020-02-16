import { EmisorPlugin } from '@emisor/core';
import { isSymbol } from '@emisor/core/src/helpers';

const REPLAY_TAG = Symbol();

export const MODE_DEFAULT_ALLOW = Symbol('MODE_DEFAULT_ALLOW');
export const MODE_DEFAULT_DENY = Symbol('MODE_DEFAULT_DENY');

/**
 * 
 */
export class EmisorPluginHistory extends EmisorPlugin {
  #mode

  /**
   * @type {import('@emisor/core').EmisorEvent[]}
   */
  #events

  #maxLength

  #key

  #history = new Map();

  /**
   * @param {object} [options]
   * @param {string} [options.key=history]
   * @param {number} [options.maxLength=1]
   * @param {MODE_DEFAULT_ALLOW|MODE_DEFAULT_DENY} [options.mode=MODE_DEFAULT_ALLOW]
   * @param {import('@emisor/core').EmisorEvent[]} [options.events]
   */
  constructor ({
    mode = MODE_DEFAULT_ALLOW,
    events = [],
    key = 'history',
    maxLength = 1
  } = {}) {
    super();
    this.#maxLength = maxLength;
    this.#key = key;
    this.#mode = mode;
    this.#events = events;
  }

  /**
  * @param {import('@emisor/core').EmisorPluginHook} hook 
  */
  install (hook) {
    hook.afterOn.key(this.#key, (...args) => this.#afterOn(...args));
    hook.beforeEmit.all((...args) => this.#beforeEmit(...args));
  }

  /**
   * 
   * @param {import('@emisor/core').EmisorHookMeta} meta
   * @param {import('@emisor/core').EmisorHookAPI} Emisor 
   */
  #afterOn ({event: {event, handler}, options}, Emisor) {
    let replay =  (history = []) => {
      let maxLength = options === true ? this.#maxLength : options;
      history.slice(-maxLength).reverse().forEach(({payload, event}) => Emisor.rawEmit(event, payload, handler, REPLAY_TAG))
    }
    //when event is a Symbol
    if (isSymbol(event) || !(event).includes('*')) {
      return replay(this.#history.get(event));
    }
  }
  
  #isAllowed (parsedEvents) {
    if (this.#mode === MODE_DEFAULT_ALLOW) {
      return this.#events.length === 0 || !parsedEvents.find((e) => this.#events.includes(e));
    }
    if (this.#mode === MODE_DEFAULT_DENY) {
      return this.#events.length !== 0 && !!parsedEvents.find((e) => this.#events.includes(e));
    }
  }

  /**
   * 
   * @param {import('@emisor/core').EmisorHookMeta} meta
   * @param {import('@emisor/core').EmisorHookAPI} Emisor 
   */
  #beforeEmit ({event:$event, payload}, Emisor) {
    let {event, time, tag} = $event;
    if (tag === REPLAY_TAG) {
      delete $event.tag;
      return;
    }
    if (!this.#isAllowed(Emisor.parseEvent(event))) {
      return;
    }
    let history = this.#history.get(event) || [];
    if (history.length === this.#maxLength) {
      history.shift();
    }
    history.push({
      payload,
      time,
      event
    });
    this.#history.set(event, history);
  }
}