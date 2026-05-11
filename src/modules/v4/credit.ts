import { randomInt } from 'node:crypto';

import { MAX_CREDIT_COUNT } from '../../constants.js';

export interface CreditCard {
    number: string;
    formatted: string;
    brand: string;
    expiry: string;
    cvv: string;
    luhn: true;
}

export interface CreditResult {
    cards: CreditCard[];
}

type Brand = 'visa' | 'mastercard' | 'amex' | 'discover';

const BRANDS: Brand[] = ['visa', 'mastercard', 'amex', 'discover'];

const IIN_PREFIXES: Record<Brand, string[]> = {
    visa: ['4'],
    mastercard: ['51', '52', '53', '54', '55'],
    amex: ['34', '37'],
    discover: ['6011', '65'],
};

const CARD_LENGTHS: Record<Brand, number> = {
    visa: 16,
    mastercard: 16,
    amex: 15,
    discover: 16,
};

function luhnCheckDigit(partial: string): number {
    const digits = partial.split('').map(Number);
    let sum = 0;
    let alt = true; // next-to-last position is doubled
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = digits[i]!;
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return (10 - (sum % 10)) % 10;
}

function formatFull(num: string, brand: Brand): string {
    if (brand === 'amex') {
        // 4-6-5 format
        return `${num.slice(0, 4)} ${num.slice(4, 10)} ${num.slice(10)}`;
    }
    // 4-4-4-4 format
    return num.match(/.{1,4}/g)!.join(' ');
}

function formatMasked(num: string, brand: Brand): string {
    if (brand === 'amex') {
        // 4-*-5: show first 4, mask middle 6, show last 5
        return `${num.slice(0, 4)} ${'*'.repeat(6)} ${num.slice(10)}`;
    }
    // 4-*-4: show first 4, mask middle 8, show last 4
    return `${num.slice(0, 4)} ${'*'.repeat(8)} ${num.slice(-4)}`;
}

function generateCard(brand: Brand): { number: string; brand: Brand; expiry: string; cvv: string } {
    const prefixes = IIN_PREFIXES[brand];
    const prefix = prefixes[randomInt(prefixes.length)]!;
    const length = CARD_LENGTHS[brand];
    const cvvLength = brand === 'amex' ? 4 : 3;

    let partial = prefix;
    while (partial.length < length - 1) {
        partial += randomInt(10).toString();
    }
    const number = partial + luhnCheckDigit(partial);

    const now = new Date();
    const year = now.getFullYear() + randomInt(1, 6);
    const month = String(randomInt(1, 13)).padStart(2, '0');
    const expiry = `${month}/${String(year).slice(-2)}`;

    const cvv = String(randomInt(Math.pow(10, cvvLength - 1), Math.pow(10, cvvLength))).padStart(cvvLength, '0');

    return { number, brand, expiry, cvv };
}

/**
 * Generates fictitious credit card numbers that pass Luhn validation.
 * These are for testing purposes only — not real card numbers.
 *
 * @param brand - Card brand: visa, mastercard, amex, discover (default: random)
 * @param count - Number of cards to generate (1–10, default 1)
 * @param format - Response format: full or masked (default: masked)
 * @returns Array of generated cards with number, formatted, expiry, cvv
 * @throws Error if brand is unknown, count is out of range, or format is invalid
 */
export default function credit(brand?: string, count: number = 1, format: string = 'masked'): CreditResult {
    const resolvedBrand: Brand =
        !brand || brand === 'random'
            ? BRANDS[randomInt(BRANDS.length)]!
            : (() => {
                  if (!BRANDS.includes(brand as Brand)) {
                      throw new Error(`Unknown brand "${brand}". Valid options: ${BRANDS.join(', ')}`);
                  }
                  return brand as Brand;
              })();

    if (!Number.isInteger(count) || count < 1 || count > MAX_CREDIT_COUNT) {
        throw new Error(`Count must be an integer between 1 and ${MAX_CREDIT_COUNT}`);
    }

    if (format !== 'full' && format !== 'masked') {
        throw new Error('Format must be "full" or "masked"');
    }

    const cards = Array.from({ length: count }, (): CreditCard => {
        const { number, brand: b, expiry, cvv } = generateCard(resolvedBrand);
        const isMasked = format === 'masked';
        return {
            number: isMasked ? number.slice(0, 4) + '*'.repeat(number.length - 8) + number.slice(-4) : number,
            formatted: isMasked ? formatMasked(number, b) : formatFull(number, b),
            brand: b,
            expiry,
            cvv,
            luhn: true,
        };
    });

    return { cards };
}
