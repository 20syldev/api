import { MAX_BASE_VALUE_LENGTH } from '../../constants.js';

export interface BaseResult {
    value: string;
    from: number;
    to: number;
    result: string;
}

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function parseDigits(digits: string, from: number): bigint {
    const radix = BigInt(from);
    let parsed = 0n;
    for (const char of digits) {
        const digit = DIGITS.indexOf(char);
        if (digit === -1 || digit >= from) throw new Error(`Invalid value for base ${from}`);
        parsed = parsed * radix + BigInt(digit);
    }
    return parsed;
}

/**
 * Converts a number between numeric bases (2-36) with arbitrary precision.
 *
 * @param value - The value to convert, optionally prefixed with a minus sign
 * @param from - Input base (default 10)
 * @param to - Output base (default 16)
 * @returns Object with the original value, both bases and the lowercase result
 * @throws Error if the value is missing, too long or invalid for the input base, or if a base is out of range
 */
export default function base(value: string, from: number = 10, to: number = 16): BaseResult {
    if (!value) throw new Error('Please provide a value (?value={value})');
    if (value.length > MAX_BASE_VALUE_LENGTH) {
        throw new Error(`Value must be ${MAX_BASE_VALUE_LENGTH} characters or fewer`);
    }
    if (!Number.isInteger(from) || !Number.isInteger(to)) throw new Error('Base must be a number');
    if (from < 2 || from > 36 || to < 2 || to > 36) throw new Error('Base must be between 2 and 36');

    const negative = value.startsWith('-');
    const digits = (negative ? value.slice(1) : value).toLowerCase();
    if (!digits) throw new Error(`Invalid value for base ${from}`);

    const parsed = parseDigits(digits, from);
    const sign = negative && parsed !== 0n ? '-' : '';

    return { value, from, to, result: sign + parsed.toString(to) };
}
