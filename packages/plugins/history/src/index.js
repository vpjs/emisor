import { EmisorPlugin, helpers } from '@emisor/core';

export const MODE_DEFAULT_ALLOW = Symbol('MODE_DEFAULT_ALLOW');
export const MODE_DEFAULT_DENY = Symbol('MODE_DEFAULT_DENY');

/**
 * @typedef {import('@emisor/core/src').EmisorPluginHook} EmisorPluginHook
 */

const TAG_HISTORY_REPLAY = Symbol();

function getReplayTag (tags) {
  for (let tag of tags) {
    if (Array.isArray(tag) && tag[0] === TAG_HISTORY_REPLAY) {
      return tag;
    }
  }
}

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

  #inReplay = new Map();


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
  * @param {EmisorPluginHook} hook
  */
  install ({afterOn, onEmit, eventStr, subscriberFilter, beforePublish }) {
    afterOn.key(this.#key, (...args) => this.#afterOn(...args));
    onEmit.all((...args) => this.#onEmit(...args));
    subscriberFilter.all((...args) => this.#filter(...args));
    beforePublish.all(({event: {tags}}) => {
      let tag = getReplayTag(tags);
      if (tag) {
        return {
          [EmisorPlugin.REMOVE_TAG]: tag
        };
      }
    }); 
    eventStr.prefix('>', () => ({
      [this.#key]: true
    }));
  }

  #filter ({event: {tags, handler}}) {
    let [,key] = getReplayTag(tags) ?? [];
    if (!key) {
      return true;
    }
    if (this.#inReplay.get(key) === handler) {
      this.#inReplay.delete(key);
      return true;
    }
    return false;

  }

  /**
   * 
   * @param {import('@emisor/core').EmisorHookMeta} meta
   * @param {import('@emisor/core').EmisorHookAPI} Emisor 
   */
  #afterOn ({event: {event, handler}, options}, Emisor) {
    let replay =  (history = []) => {
      let maxLength = options === true ? this.#maxLength : options;
      history
      .slice(-maxLength)
      .reverse()
      .forEach(({payload, event, tags}) => {
        let key = Symbol();
        this.#inReplay.set(key, handler);
        Emisor.emit(event, payload, [
          ...tags, 
          [TAG_HISTORY_REPLAY, key]
        ]);
      });
    };
    //when event is a Symbol
    if (!helpers.isString(event) || !event.includes('*')) {
      replay(this.#history.get(event));
    }
  }
  
  #isAllowed (parsedEvents) {
    if (this.#mode === MODE_DEFAULT_ALLOW) {
      return this.#events.length === 0 || !parsedEvents.find((e) => this.#events.includes(e));
    }
    if (this.#mode === MODE_DEFAULT_DENY) {
      return this.#events.length !== 0 && !!parsedEvents.find((e) => this.#events.includes(e));
    }
    return false;
  }

  /**
   * 
   * @param {import('@emisor/core').EmisorHookMeta} meta
   * @param {import('@emisor/core').EmisorHookAPI} Emisor 
   */
  #onEmit ({event:{event, tags}, payload}, Emisor) {
    if (getReplayTag(tags)) {
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
      event,
      tags
    });
    this.#history.set(event, history);
  }
}