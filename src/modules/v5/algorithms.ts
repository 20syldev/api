import { MAX_FACTORIAL, MAX_GCD_VALUE } from '../../constants.js';
export * from '../v4/algorithms.js';

/**
 * Computes the factorial of a non-negative integer.
 */
export function factorial(value: string | number): number {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (!Number.isInteger(num)) throw new Error('Value must be an integer');
    if (num < 0) throw new Error('Number must be positive');
    if (num > MAX_FACTORIAL) throw new Error('Number must be between 0 and 170');

    return num <= 1 ? 1 : num * factorial(num - 1);
}

/**
 * Determines whether a given number is prime.
 */
export function isprime(value: string | number): boolean {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (!Number.isInteger(num)) throw new Error('Value must be an integer');
    if (num < 1) throw new Error('Number must be positive');
    if (num > MAX_GCD_VALUE) throw new Error('Number must be between 1 and 100000');
    if (num < 2) return false;

    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }

    return true;
}
