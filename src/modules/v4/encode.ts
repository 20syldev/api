import { MAX_STRING_LENGTH } from '../../constants.js';

const MORSE_TABLE: Record<string, string> = {
    A: '.-',
    B: '-...',
    C: '-.-.',
    D: '-..',
    E: '.',
    F: '..-.',
    G: '--.',
    H: '....',
    I: '..',
    J: '.---',
    K: '-.-',
    L: '.-..',
    M: '--',
    N: '-.',
    O: '---',
    P: '.--.',
    Q: '--.-',
    R: '.-.',
    S: '...',
    T: '-',
    U: '..-',
    V: '...-',
    W: '.--',
    X: '-..-',
    Y: '-.--',
    Z: '--..',
    '0': '-----',
    '1': '.----',
    '2': '..---',
    '3': '...--',
    '4': '....-',
    '5': '.....',
    '6': '-....',
    '7': '--...',
    '8': '---..',
    '9': '----.',
    '.': '.-.-.-',
    ',': '--..--',
    '?': '..--..',
    "'": '.----.',
    '!': '-.-.--',
    '/': '-..-.',
    '(': '-.--.',
    ')': '-.--.-',
    '&': '.-...',
    ':': '---...',
    ';': '-.-.-.',
    '=': '-...-',
    '+': '.-.-.',
    '-': '-....-',
    _: '..--.-',
    '"': '.-..-.',
    $: '...-..-',
    '@': '.--.-.',
};

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

function checkText(value: string): void {
    if (!value) throw new Error('A value is required');
    if (typeof value !== 'string') throw new Error('Value must be a string');
    if (value.length > MAX_STRING_LENGTH)
        throw new Error(`Value must be less than ${MAX_STRING_LENGTH} characters long`);
}

/**
 * Encodes a UTF-8 string to Base64.
 *
 * @param value - The string to encode
 * @returns Base64-encoded string
 * @throws Error if value is missing, not a string, or too long
 */
export function base64encode(value: string): string {
    checkText(value);
    return Buffer.from(value, 'utf-8').toString('base64');
}

/**
 * Decodes a Base64 string to UTF-8.
 *
 * @param value - The Base64 string to decode
 * @returns Decoded UTF-8 string
 * @throws Error if value is missing, not valid Base64, or too long
 */
export function base64decode(value: string): string {
    checkText(value);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error('Invalid Base64 string');
    return Buffer.from(value, 'base64').toString('utf-8');
}

/**
 * Percent-encodes a string for safe use in a URL.
 *
 * @param value - The string to encode
 * @returns URL-encoded string
 * @throws Error if value is missing, not a string, or too long
 */
export function urlencode(value: string): string {
    checkText(value);
    return encodeURIComponent(value);
}

/**
 * Decodes a percent-encoded URL string.
 *
 * @param value - The URL-encoded string to decode
 * @returns Decoded string
 * @throws Error if value is missing, not a valid URL-encoded string, or too long
 */
export function urldecode(value: string): string {
    checkText(value);
    try {
        return decodeURIComponent(value);
    } catch {
        throw new Error('Invalid URL-encoded string');
    }
}

/**
 * Converts a plain text string to Morse code.
 *
 * @param value - The text to encode in Morse code
 * @returns Morse code string where letters are separated by spaces and words by " / "
 * @throws Error if value contains unsupported characters or is too long
 */
export function morse(value: string): string {
    checkText(value);
    return value
        .toUpperCase()
        .split(' ')
        .map((word) =>
            word
                .split('')
                .map((c) => {
                    if (c === '\n' || c === '\t') return '';
                    const code = MORSE_TABLE[c];
                    if (!code) throw new Error(`Unsupported character in Morse code: '${c}'`);
                    return code;
                })
                .filter(Boolean)
                .join(' '),
        )
        .join(' / ');
}

/**
 * Converts a Morse code string back to plain text.
 *
 * @param value - Morse code string (letters separated by spaces, words by " / ")
 * @returns Decoded plain text string
 * @throws Error if the Morse code contains an unrecognized sequence or is too long
 */
export function unmorse(value: string): string {
    checkText(value);
    return value
        .split(' / ')
        .map((word) =>
            word
                .split(' ')
                .map((code) => {
                    if (!code) return '';
                    const char = MORSE_REVERSE[code];
                    if (!char) throw new Error(`Unsupported Morse sequence: '${code}'`);
                    return char;
                })
                .join(''),
        )
        .join(' ');
}

/**
 * Applies the ROT13 substitution cipher to a string.
 *
 * @param value - The string to encode
 * @returns ROT13-encoded string (applying it twice restores the original)
 * @throws Error if value is missing, not a string, or too long
 */
export function rot13(value: string): string {
    checkText(value);
    return value.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

/**
 * Applies the Caesar cipher by shifting alphabetic characters by a given amount.
 *
 * @param value - The string to encode
 * @param shift - Number of positions to shift (can be negative for left shift)
 * @returns Caesar-shifted string
 * @throws Error if value is missing or shift is not a number
 */
export function caesar(value: string, shift: string): string {
    checkText(value);
    const n = Number(shift);
    if (isNaN(n)) throw new Error('Shift must be a number');
    const s = ((n % 26) + 26) % 26;
    return value.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
    });
}

/**
 * Converts a string to its binary representation, one byte per character.
 *
 * @param value - The string to convert
 * @returns Space-separated 8-bit binary groups (one per character)
 * @throws Error if value is missing, not a string, or too long
 */
export function binary(value: string): string {
    checkText(value);
    return value
        .split('')
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');
}

/**
 * Converts a binary string back to plain text.
 *
 * @param value - Space-separated 8-bit binary groups
 * @returns Decoded string
 * @throws Error if value contains non-binary characters or groups are not 8 bits wide
 */
export function unbinary(value: string): string {
    checkText(value);
    if (!/^[01\s]+$/.test(value)) throw new Error('Invalid binary string');
    return value
        .trim()
        .split(/\s+/)
        .map((b) => {
            if (b.length !== 8) throw new Error('Each binary group must contain 8 bits');
            return String.fromCharCode(parseInt(b, 2));
        })
        .join('');
}
