//@ts-check
import { EmisorPlugin } from '@emisor/core';

const COUNT = Symbol('count');

export class EmisorPluginCount extends EmisorPlugin {
  
  /**
   * @param {{key: string}} [options]
   */
  constructor ({key = 'count'}) {
    super({key});
  }
  
  /**
   * @param {import('@emisor/core').EmisorCore} Emisor 
   * @param {import('@emisor/core').EmisorEventObject} $event 
   * @param {object} $config
   */
  afterEmit (Emisor, $config, _, $event) {
    //key should contain a number what is higher then 0
    if ($config[this.key] > 0) {
      //get account
      $config[COUNT] = $config[COUNT] ?? $config[this.key];
      if ($config[COUNT] === 1) {
        Emisor.off($event.event, $event.handler);
      } else {
        $config[COUNT]--;
      }
    }
  }

}