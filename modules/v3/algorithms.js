/**
 * Check if two strings are anagrams of each other
 *
 * @param {string} value - First string to compare
 * @param {string} value2 - Second string to compare
 * @returns {boolean} - True if strings are anagrams, false otherwise
 * @throws {Error} - If inputs are invalid
 */
export function anagram(value, value2) {
    if (!value) throw new Error('First value is required');
    if (!value2) throw new Error('Second value is required');

    if (typeof value !== 'string') throw new Error('First value must be a string');
    if (typeof value2 !== 'string') throw new Error('Second value must be a string');

    if (value.length < 2) throw new Error('First value must be at least two characters long');
    if (value.length > 1000) throw new Error('First value must be less than 1000 characters long');

    if (value2.length < 2) throw new Error('Second value must be at least two characters long');
    if (value2.length > 1000) throw new Error('Second value must be less than 1000 characters long');

    return value.split('').sort().join('') === value2.split('').sort().join('');
}

/**
 * Sort an array using bubble sort algorithm
 *
 * @param {string} value - Comma-separated list of numbers
 * @returns {number[]} - Sorted array of numbers
 * @throws {Error} - If input is invalid
 */
export function bubblesort(value) {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    const arr = value.split(',').map(Number);

    if (arr.some(isNaN)) throw new Error('Array must contain only numbers');
    if (arr.length < 2) throw new Error('Array must contain at least two numbers');
    if (arr.length > 1000) throw new Error('Array must contain less than 1000 numbers');

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
    }

    return arr;
}

/**
 * Calculate the factorial of a number
 *
 * @param {number} value - Number to calculate factorial for
 * @returns {number} - Factorial result
 * @throws {Error} - If input is invalid or out of range
 */
export function factorial(value) {
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < 0) throw new Error('Number must be positive');
    if (value > 170) throw new Error('Number must be between 0 and 170');

    return value <= 1 ? 1 : value * factorial(value - 1);
}

/**
 * Generate a Fibonacci sequence up to the specified length
 *
 * @param {number} value - Length of Fibonacci sequence to generate
 * @returns {number[]} - Array of Fibonacci numbers
 * @throws {Error} - If input is invalid or out of range
 */
export function fibonacci(value) {
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < 0) throw new Error('Number must be positive');
    if (value > 1000) throw new Error('Number must be between 0 and 1000');

    let fib = [0, 1];

    for (let i = 2; i < parseInt(value); i++) {
        fib.push(fib[i - 1] + fib[i - 2]);
    }

    return fib.slice(0, parseInt(value));
}

/**
 * Calculate the greatest common divisor (GCD) of two numbers
 *
 * @param {number} value - First number
 * @param {number} value2 - Second number
 * @returns {number} - Greatest common divisor
 * @throws {Error} - If inputs are invalid or out of range
 */
export function gcd(value, value2) {
    if (isNaN(value)) throw new Error('First value must be a number');
    if (isNaN(value2)) throw new Error('Second value must be a number');

    if (value <= 0) throw new Error('First number must be strictly positive');
    if (value2 <= 0) throw new Error('Second number must be strictly positive');

    if (value > 100000) throw new Error('First number must be between 0 and 100000');
    if (value2 > 100000) throw new Error('Second number must be between 0 and 100000');

    value = Math.abs(value);
    value2 = Math.abs(value2);

    while (value2) [value, value2] = [value2, value % value2];

    return value;
}

/**
 * Check if a number is prime
 *
 * @param {number} value - Number to check
 * @returns {boolean} - True if the number is prime, false otherwise
 * @throws {Error} - If input is invalid or out of range
 */
export function isprime(value) {
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < 1) throw new Error('Number must be positive');
    if (value > 100000) throw new Error('Number must be between 1 and 100000');

    for (let i = 2; i <= Math.sqrt(value); i++) {
        if (value % i === 0) return false;
    }

    return true;
}

/**
 * Check if a string is a palindrome
 *
 * @param {string} value - String to check
 * @returns {boolean} - True if the string is a palindrome, false otherwise
 * @throws {Error} - If input is invalid
 */
export function palindrome(value) {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    if (value.length < 2) throw new Error('Value must be at least two characters long');
    if (value.length > 1000) throw new Error('Value must be less than 1000 characters long');

    return value === value.split('').reverse().join('');
}

/**
 * Find all prime factors of a number
 *
 * @param {number} value - Number to factorize
 * @returns {number[]} - Array of prime factors
 * @throws {Error} - If input is invalid or out of range
 */
export function primefactors(value) {
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < 2) throw new Error('Number must be positive and greater than 1');
    if (value > 100000) throw new Error('Number must be between 2 and 100000');

    const factors = [];

    for (let i = 2; i <= value; i++) {
        while (value % i === 0) {
            factors.push(i);
            value /= i;
        }
    }

    return factors;
}

/**
 * Generate a list of all prime numbers up to the specified limit
 *
 * @param {number} value - Upper limit to check for primes
 * @returns {number[]} - Array of prime numbers
 * @throws {Error} - If input is invalid or out of range
 */
export function primelist(value) {
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < 2) throw new Error('Number must be positive and greater than 1');
    if (value > 10000) throw new Error('Number must be between 2 and 10000');

    const primes = [];

    for (let i = 2; i <= value; i++) {
        let isPrime = true;

        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }

        if (isPrime) primes.push(i);
    }

    return primes;
}

/**
 * Reverse a string
 *
 * @param {string} value - String to reverse
 * @returns {string} - Reversed string
 * @throws {Error} - If input is invalid
 */
export function reverse(value) {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    return value.split('').reverse().join('');
}