export class EmisorTypeError extends TypeError {
  constructor(param, expect, given) {
    super(`${param} has to be a ${expect}, ${typeof given} given`);
  }
}

export class EmisorError extends Error {}

/**
 * Error object
 */
export class EmisorPluginError extends EmisorError {}


export class EmisorPluginTypeError extends EmisorTypeError {}