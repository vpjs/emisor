function getName (obj) {
  return ({}).toString.call(obj);
}

/**
 * is given value a symbol
 * @param {*} value
 * @returns {boolean}  
 */
export function isSymbol (value) {
  return typeof value === 'symbol' || getName(value) == '[object Symbol]';
}

/**
 * is given value a RegExp
 * @param {*} value
 * @returns {boolean}  
 */
export function isRegExp (value) {
  return getName(value) == '[object RegExp]';
}
/**
 * check of given value is a string
 * @param {*} value
 * @returns {boolean} 
 */
export function isString (value) {
  return typeof value === 'string' || getName(value) == '[object String]';
}

/**
 * check of given value is a function
 * @param {*} value
 * @returns {boolean} 
 */
export function isFunction (value) {
  return typeof value === 'function';
}