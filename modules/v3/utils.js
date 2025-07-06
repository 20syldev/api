/**
 * Shared utility functions for the API modules
 */

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

/**
 * Format a JavaScript Date object to ISO format without timezone.
 *
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

/**
 * Manage rate limiting for users
 *
 * @param {Object} rateLimits - Rate limits object
 * @param {string} userId - User ID
 * @param {number} timestamp - Current timestamp
 * @param {number} window - Time window in milliseconds
 * @param {number} limit - Maximum requests in window
 * @returns {boolean} - True if rate limit is exceeded
 * @throws {Error} - If rate limit is exceeded
 */
export function checkRateLimit(rateLimits, userId, timestamp, window = 10000, limit = 50) {
    rateLimits[userId] = (rateLimits[userId] || []).filter(ts => timestamp - ts < window);

    if (rateLimits[userId].length > limit) {
        const remainingTime = Math.ceil((rateLimits[userId][0] + window - timestamp) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${remainingTime} seconds.`);
    }

    rateLimits[userId].push(timestamp);
    return false;
}