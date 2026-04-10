import { MAX_FACTORIAL, MAX_GCD_VALUE, MAX_PRIME_LIST, MAX_STRING_LENGTH, ROMAN_VALUES } from '../../constants.js';

export function anagram(value: string, value2: string): boolean {
    if (!value) throw new Error('First value is required');
    if (!value2) throw new Error('Second value is required');

    if (typeof value !== 'string') throw new Error('First value must be a string');
    if (typeof value2 !== 'string') throw new Error('Second value must be a string');

    if (value.length < 2) throw new Error('First value must be at least two characters long');
    if (value.length > MAX_STRING_LENGTH) throw new Error('First value must be less than 1000 characters long');

    if (value2.length < 2) throw new Error('Second value must be at least two characters long');
    if (value2.length > MAX_STRING_LENGTH) throw new Error('Second value must be less than 1000 characters long');

    return value.split('').sort().join('') === value2.split('').sort().join('');
}

export function bubblesort(value: string): number[] {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    const arr = value.split(',').map(Number);

    if (arr.some(isNaN)) throw new Error('Array must contain only numbers');
    if (arr.length < 2) throw new Error('Array must contain at least two numbers');
    if (arr.length > MAX_STRING_LENGTH) throw new Error('Array must contain less than 1000 numbers');

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j]! > arr[j + 1]!) [arr[j], arr[j + 1]] = [arr[j + 1]!, arr[j]!];
        }
    }

    return arr;
}

export function factorial(value: string | number): number {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (num < 0) throw new Error('Number must be positive');
    if (num > MAX_FACTORIAL) throw new Error('Number must be between 0 and 170');

    return num <= 1 ? 1 : num * factorial(num - 1);
}

export function fibonacci(value: string | number): number[] {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (num < 0) throw new Error('Number must be positive');
    if (num > 1000) throw new Error('Number must be between 0 and 1000');

    const fib = [0, 1];

    for (let i = 2; i < num; i++) {
        fib.push(fib[i - 1]! + fib[i - 2]!);
    }

    return fib.slice(0, num);
}

export function gcd(value: string | number, value2: string | number): number {
    let a = Number(value);
    let b = Number(value2);
    if (isNaN(a)) throw new Error('First value must be a number');
    if (isNaN(b)) throw new Error('Second value must be a number');

    if (a <= 0) throw new Error('First number must be strictly positive');
    if (b <= 0) throw new Error('Second number must be strictly positive');

    if (a > MAX_GCD_VALUE) throw new Error('First number must be between 0 and 100000');
    if (b > MAX_GCD_VALUE) throw new Error('Second number must be between 0 and 100000');

    a = Math.abs(a);
    b = Math.abs(b);

    while (b) [a, b] = [b, a % b];

    return a;
}

export function isprime(value: string | number): boolean {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (num < 1) throw new Error('Number must be positive');
    if (num > MAX_GCD_VALUE) throw new Error('Number must be between 1 and 100000');

    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }

    return true;
}

export function palindrome(value: string): boolean {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    if (value.length < 2) throw new Error('Value must be at least two characters long');
    if (value.length > MAX_STRING_LENGTH) throw new Error('Value must be less than 1000 characters long');

    return value === value.split('').reverse().join('');
}

export function primefactors(value: string | number): number[] {
    let num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (num < 2) throw new Error('Number must be positive and greater than 1');
    if (num > MAX_GCD_VALUE) throw new Error('Number must be between 2 and 100000');

    const factors: number[] = [];

    for (let i = 2; i <= num; i++) {
        while (num % i === 0) {
            factors.push(i);
            num /= i;
        }
    }

    return factors;
}

export function primelist(value: string | number): number[] {
    const num = Number(value);
    if (isNaN(num)) throw new Error('Value must be a number');
    if (num < 2) throw new Error('Number must be positive and greater than 1');
    if (num > MAX_PRIME_LIST) throw new Error('Number must be between 2 and 10000');

    const primes: number[] = [];

    for (let i = 2; i <= num; i++) {
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

export function reverse(value: string): string {
    if (!value) throw new Error('A value is required');

    if (typeof value !== 'string') throw new Error('Value must be a string');

    return value.split('').reverse().join('');
}

export function roman(value: string): number | string {
    if (!value) throw new Error('A value is required');

    const num = Number(value);
    if (!isNaN(num)) {
        if (!Number.isInteger(num)) throw new Error('Value must be an integer');
        if (num < 1 || num > 3999) throw new Error('Number must be between 1 and 3999');

        let result = '';
        let n = num;
        for (const [val, sym] of ROMAN_VALUES) {
            while (n >= val) {
                result += sym;
                n -= val;
            }
        }
        return result;
    }

    if (typeof value !== 'string') throw new Error('Value must be a number or a Roman numeral');
    const upper = value.toUpperCase();
    if (!/^[MDCLXVI]+$/.test(upper)) throw new Error('Invalid Roman numeral');

    let result = 0;
    let i = 0;
    while (i < upper.length) {
        const two = upper.slice(i, i + 2);
        const match = ROMAN_VALUES.find(([, sym]) => sym === two);
        if (match) {
            result += match[0];
            i += 2;
        } else {
            const one = ROMAN_VALUES.find(([, sym]) => sym === upper[i]);
            if (!one) throw new Error('Invalid Roman numeral');
            result += one[0];
            i += 1;
        }
    }

    return result;
}
