//@ts-check

/**
 * @callback beforeEmitHook
 * @param {import('./index').EmisorCore} Emisor 
 * @param {object} $config
 * @param {object} $storage
 * @param {import('./index').EmisorEventObject} $event
 * @return {Promise}
 */

/**
 * @callback afterEmitHook
 * @param {import('./index').EmisorCore} Emisor 
 * @param {object} $config
 * @param {object} $storage
 * @param {import('./index').EmisorEventObject} $event
 * @return {Promise}
 */

/**
 * @typedef {beforeEmitHook|afterEmitHook} EmisorPluginHooks
 */

/**
 * @typedef IEmisorPlugin
 * @property {beforeEmitHook} beforeEmit
 * @property {afterEmitHook} afterEmit
 * @property {string} key
 */

export class EmisorPluginError extends Error {}
 
export class EmisorPlugin {
  #key
    
  get key () {
    return this.#key;
  }
    
  /**
   * @param {{key: string}} options
   */
  constructor ({key}) {
    if (typeof key !== 'string') {
      throw new EmisorPluginError(`Plugin key has to be a string, ${typeof key} given`);
    }
    if (!key) {
      throw new EmisorPluginError('Plugin key can not be empty');
    }
    this.#key =  key;
  }
}