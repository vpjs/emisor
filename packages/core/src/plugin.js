/**
 * @typedef {import('./hook').EmisorHook} EmisorHook
 * @typedef {import('./hook').EmisorHookAll} EmisorHookAll
 * @typedef {import('./hook').EmisorHookEventStr} EmisorHookEventStr
 */

import { EmisorPluginError } from './errors';

/**
 * @typedef {object} EmisorPluginHook 
 * @prop {EmisorHook["pluginApi"]} beforeOn
 * @prop {EmisorHook["pluginApi"]} afterOn
 * @prop {EmisorHook["pluginApi"]} beforePublish
 * @prop {EmisorHook["pluginApi"]} afterPublish
 * @prop {EmisorHook["pluginApi"]} beforeOff
 * @prop {EmisorHook["pluginApi"]} afterOff
 * @prop {EmisorHookAll["pluginApi"]} onEmit
 * @prop {EmisorHookEventStr["pluginApi"]} eventStr
 */

/**
 * @typedef {object} IEmisorPlugin
 * @prop {(EmisorPluginHook)=>void} install - install plugin
 */

const OVERWRITE_PAYLOAD_KEY = Symbol();
const OVERWRITE_HANDLER_KEY = Symbol();
const BREAK_KEY = Symbol();
const KILL_KEY = Symbol();
const REMOVE_TAG = Symbol();
const ADD_TAG = Symbol();
/**
 * @implements {IEmisorPlugin}
 */
export class EmisorPlugin {

  /**
    * Result key that should contain the new payload
    * Can only be used by `beforePublish`and `onEmit`hooks,
    * and `afterPublish` but will only affect payload for other hooks
    * @example (payload, $event) => ({[EmisorPlugin.OVERWRITE_PAYLOAD_KEY]: 'new payload'})
    */
  static get OVERWRITE_PAYLOAD_KEY () {
    return OVERWRITE_PAYLOAD_KEY;
  }

  /**
   * Result key that should contain the new event handler
   * Can only be used by `beforeOn`
   * @example (payload, $event) => ({[EmisorPlugin.OVERWRITE_HANDLER_KEY]: () => {}})
   */
  static get OVERWRITE_HANDLER_KEY () {
    return OVERWRITE_HANDLER_KEY;
  }

  /**
   * This will break execution of all other hooks
   */
  static get BREAK_KEY () {
    return BREAK_KEY;
  }

  /**
   * This will break execution of all other hooks and stop further execution emit
   */
  static get KILL_KEY () {
    return KILL_KEY;
  }

  static get REMOVE_TAG () {
    return REMOVE_TAG;
  }

  static get ADD_TAG () {
    return ADD_TAG;
  }

  install () {
    throw new EmisorPluginError('Plugin is missing a install method');
  }
}