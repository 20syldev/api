/**
 * Return a random element from an array.
 *
 * @param {Array} arr - The array to choose from.
 * @returns {*} - A random element from the array.
 */
export function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Return a random number between min and max (inclusive).
 *
 * @param {number} min - The minimum number.
 * @param {number} max - The maximum number.
 * @returns {number} - A random number between min and max.
 */
export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random IP address.
 *
 * @returns {string} - A random IP address in the format "X.X.X.X".
 */
export function genIP() {
    return `${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}`;
}
