import { randomBytes } from 'crypto';
import { v4 } from 'uuid';

/**
 * Generate a random token of specified length and type.
 *
 * @param {number} len - Length of the token
 * @param {string} type - Type of token to generate
 * @returns {string} - The generated token
 * @throws {Error} - If inputs are invalid
 */
export default function token(len, type = 'alphanum') {
    // Input validation
    if (isNaN(len) || len < 12) {
        throw new Error('Length must be a number greater than or equal to 12');
    }

    if (len > 4096) {
        throw new Error('Length cannot exceed 4096');
    }

    // Helper function to generate token from character set
    const genToken = (chars, length) => {
        return Array.from({ length }, () => {
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
    }

    // Token type definitions
    const tokenTypes = {
        alpha: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', len),
        alphanum: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len),
        base64: () => randomBytes(Math.ceil(len * 0.75)).toString('base64').slice(0, len),
        hex: () => randomBytes(Math.ceil(len * 0.5)).toString('hex').slice(0, len),
        num: () => genToken('0123456789', len),
        punct: () => genToken('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', len),
        urlsafe: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', len),
        uuid: () => v4().replace(/-/g, '').slice(0, len)
    };

    // Generate token based on type or default to alphanum
    if (!tokenTypes[type.toLowerCase()]) {
        throw new Error(`Invalid token type. Valid types: ${Object.keys(tokenTypes).join(', ')}`);
    }

    // Generate token based on type or default to alphanum
    return (tokenTypes[type.toLowerCase()] || tokenTypes.alphanum)();
}