//@ts-check

/**
 * @typedef {object} EmisorPluginQueueOptions
 * @property {string} [separator] Namespace separator
 * @property {boolean} [last] Remember the last emitted data of a event
 * @property {boolean} [debug] enable debugging
 */


export class EmisorPluginQueue {
  #options = {}

  #queue = new Map()
  /**
   * 
   * @param {EmisorPluginQueueOptions} [options] 
   */
  constructor (options = {last: true}) {
    this.#options = options;
  }

  overwriteEmit (Emisor, $event, $config) {
    
  }
}