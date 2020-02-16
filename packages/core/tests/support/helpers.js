/**
 * 
 * @param {number} n string length  
 * @param {string|number} r
 * @returns {string} 
 */
export function randomString (n = 10, r='') {
  while (n--) r += String.fromCharCode((r=Math.random()*62|0, r+=r>9?(r<36?55:61):48));
  return `${r}`;
}