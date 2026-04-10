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

export function base64encode(value: string): string {
    checkText(value);
    return Buffer.from(value, 'utf-8').toString('base64');
}

export function base64decode(value: string): string {
    checkText(value);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error('Invalid Base64 string');
    return Buffer.from(value, 'base64').toString('utf-8');
}

export function urlencode(value: string): string {
    checkText(value);
    return encodeURIComponent(value);
}

export function urldecode(value: string): string {
    checkText(value);
    try {
        return decodeURIComponent(value);
    } catch {
        throw new Error('Invalid URL-encoded string');
    }
}

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

export function rot13(value: string): string {
    checkText(value);
    return value.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

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

export function binary(value: string): string {
    checkText(value);
    return value
        .split('')
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');
}

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
