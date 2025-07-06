import { getHashes, createHash } from 'crypto';

/**
 * Generate a hash of text using the specified algorithm
 *
 * @param {string} text - The text to hash
 * @param {string} method - The hash algorithm to use
 * @returns {Object} Object containing the method and resulting hash
 */
export default function hash(text, method) {
    const methods = getHashes();
    if (!methods.includes(method)) return { error: `Unsupported method. Use one of: ${methods.join(', ')}` };

    const hash = createHash(method).update(text).digest('hex');
    return { method, hash };
}