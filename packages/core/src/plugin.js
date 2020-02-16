/**
 * @typedef {import('./hook').EmisorHook} EmisorHook
 * @typedef {import('./hook').EmisorHookEventStr} EmisorHookEventStr
 */

/**
 * @typedef {object} EmisorPluginHook 
 * @prop {EmisorHook["pluginApi"]} beforeOn
 * @prop {EmisorHook["pluginApi"]} afterOn
 * @prop {EmisorHook["pluginApi"]} beforeEmit
 * @prop {EmisorHook["pluginApi"]} afterEmit
 * @prop {EmisorHook["pluginApi"]} beforeOff
 * @prop {EmisorHook["pluginApi"]} afterOff
 * @prop {EmisorHookEventStr["pluginApi"]} eventStr
 */

/**
 * @typedef {object} IEmisorPlugin
 * @prop {(EmisorPluginHook)=>void} install - install plugin
 */

/**
 * Error object
 */
export class EmisorPluginError extends Error {}

export class EmisorPluginTypeError extends EmisorPluginError {
  constructor(param, expect, given) {
    super(`${param} has to be a ${expect}, ${typeof given} given`);
  }
}

/**
 * @implements {IEmisorPlugin}
 */
export class EmisorPlugin {
  install () {
    throw new EmisorPluginError('Plugin is missing a install method');
  }
}