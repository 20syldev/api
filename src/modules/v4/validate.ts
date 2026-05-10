import { MAX_STRING_LENGTH } from '../../constants.js';

function checkValue(value: string): void {
    if (!value) throw new Error('A value is required');
    if (typeof value !== 'string') throw new Error('Value must be a string');
    if (value.length > MAX_STRING_LENGTH)
        throw new Error(`Value must be less than ${MAX_STRING_LENGTH} characters long`);
}

/**
 * Validates a credit/debit card number using the Luhn algorithm.
 *
 * @param value - Card number string (digits, spaces, or dashes allowed)
 * @returns Object containing the validity result and the sanitized digit string
 * @throws Error if value is missing, contains non-digit characters, or has an invalid length
 */
export function luhn(value: string): { valid: boolean; value: string } {
    checkValue(value);
    const digits = value.replace(/\s|-/g, '');
    if (!/^\d+$/.test(digits)) throw new Error('Value must contain only digits, spaces or dashes');
    if (digits.length < 12 || digits.length > 19) throw new Error('Card number must have between 12 and 19 digits');

    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i]!, 10);
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }

    return { valid: sum % 10 === 0, value: digits };
}

/**
 * Validates an IBAN using the mod-97 checksum algorithm.
 *
 * @param value - IBAN string (spaces allowed)
 * @returns Object containing the validity result, sanitized IBAN, and country code
 * @throws Error if value is missing, has an invalid format, or is out of length bounds
 */
export function iban(value: string): { valid: boolean; value: string; country?: string } {
    checkValue(value);
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) throw new Error('Invalid IBAN format');
    if (cleaned.length < 15 || cleaned.length > 34) throw new Error('IBAN length must be between 15 and 34 characters');

    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numeric = rearranged
        .split('')
        .map((c) => (c >= 'A' && c <= 'Z' ? (c.charCodeAt(0) - 55).toString() : c))
        .join('');

    let remainder = 0;
    for (const char of numeric) {
        remainder = (remainder * 10 + parseInt(char, 10)) % 97;
    }

    return { valid: remainder === 1, value: cleaned, country: cleaned.slice(0, 2) };
}

/**
 * Validates an email address against a basic format check.
 *
 * @param value - The email address string to validate
 * @returns Object containing the validity result and the original value
 * @throws Error if value is missing, not a string, or too long
 */
export function email(value: string): { valid: boolean; value: string } {
    checkValue(value);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { valid: regex.test(value), value };
}
