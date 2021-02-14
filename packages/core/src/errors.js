export class EmisorTypeError extends TypeError {
  constructor(param, expect, given) {
    if (!Array.isArray(expect)) {
      expect = [expect];
    }
    super(`${param} has to be a ${expect.join(' or ')}, ${typeof given} given`);
  }
}

export class EmisorError extends Error {}

/**
 * Error object
 */
export class EmisorPluginError extends EmisorError {}


export class EmisorPluginTypeError extends EmisorTypeError {}