import { MAX_STRING_LENGTH } from '../../constants.js';

const LOREM_WORDS = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
    'enim',
    'ad',
    'minim',
    'veniam',
    'quis',
    'nostrud',
    'exercitation',
    'ullamco',
    'laboris',
    'nisi',
    'aliquip',
    'ex',
    'ea',
    'commodo',
    'consequat',
    'duis',
    'aute',
    'irure',
    'in',
    'reprehenderit',
    'voluptate',
    'velit',
    'esse',
    'cillum',
    'eu',
    'fugiat',
    'nulla',
    'pariatur',
    'excepteur',
    'sint',
    'occaecat',
    'cupidatat',
    'non',
    'proident',
    'sunt',
    'culpa',
    'qui',
    'officia',
    'deserunt',
    'mollit',
    'anim',
    'id',
    'est',
    'laborum',
];

const FR_UNITS = [
    'zéro',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
];
const FR_TENS = [
    '',
    '',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante',
    'quatre-vingt',
    'quatre-vingt',
];

const EN_UNITS = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function checkText(value: string): void {
    if (!value) throw new Error('A value is required');
    if (typeof value !== 'string') throw new Error('Value must be a string');
    if (value.length > MAX_STRING_LENGTH)
        throw new Error(`Value must be less than ${MAX_STRING_LENGTH} characters long`);
}

export interface TextStats {
    characters: number;
    charactersNoSpaces: number;
    words: number;
    sentences: number;
    paragraphs: number;
    readingTime: string;
    mostFrequentChar: string;
}

export function stats(value: string): TextStats {
    checkText(value);

    const characters = value.length;
    const charactersNoSpaces = value.replace(/\s/g, '').length;
    const words = value.trim().split(/\s+/).filter(Boolean).length;
    const sentences = value.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs = value.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;

    const minutes = words / 200;
    const readingTime = minutes < 1 ? `${Math.ceil(minutes * 60)}s` : `${Math.round(minutes)}min`;

    const counts = new Map<string, number>();
    for (const c of value.replace(/\s/g, '').toLowerCase()) counts.set(c, (counts.get(c) ?? 0) + 1);
    let mostFrequentChar = '';
    let maxCount = 0;
    for (const [char, count] of counts) {
        if (count > maxCount) {
            mostFrequentChar = char;
            maxCount = count;
        }
    }

    return { characters, charactersNoSpaces, words, sentences, paragraphs, readingTime, mostFrequentChar };
}

export function slug(value: string): string {
    checkText(value);
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '-');
}

export function lorem(type: string, count: string): string {
    const n = Number(count) || 5;
    if (n < 1 || n > 500) throw new Error('Count must be between 1 and 500');

    const randomWord = (): string => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]!;
    const randomSentence = (): string => {
        const length = 5 + Math.floor(Math.random() * 10);
        const words = Array.from({ length }, randomWord);
        words[0] = words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1);
        return words.join(' ') + '.';
    };
    const randomParagraph = (): string => {
        const length = 3 + Math.floor(Math.random() * 5);
        return Array.from({ length }, randomSentence).join(' ');
    };

    switch (type) {
        case 'words':
            return Array.from({ length: n }, randomWord).join(' ');
        case 'sentences':
            return Array.from({ length: n }, randomSentence).join(' ');
        case 'paragraphs':
            return Array.from({ length: n }, randomParagraph).join('\n\n');
        default:
            throw new Error('Type must be one of: words, sentences, paragraphs');
    }
}

function frBelowHundred(n: number): string {
    if (n < 20) return FR_UNITS[n]!;
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7 || t === 9) {
        const base = FR_TENS[t]!;
        const sub = 10 + u;
        return base + (base.endsWith('-') ? '' : '-') + FR_UNITS[sub];
    }
    if (t === 8 && u === 0) return 'quatre-vingts';
    if (u === 0) return FR_TENS[t]!;
    if (u === 1 && t < 8) return FR_TENS[t] + ' et un';
    return FR_TENS[t] + '-' + FR_UNITS[u];
}

function frBelowThousand(n: number): string {
    if (n < 100) return frBelowHundred(n);
    const h = Math.floor(n / 100);
    const r = n % 100;
    let result = '';
    if (h === 1) result = 'cent';
    else result = FR_UNITS[h] + ' cent' + (r === 0 ? 's' : '');
    if (r > 0) result += ' ' + frBelowHundred(r);
    return result;
}

function numberToFrench(n: number): string {
    if (n === 0) return 'zéro';
    if (n < 0) return 'moins ' + numberToFrench(-n);
    if (n < 1000) return frBelowThousand(n);
    if (n < 1_000_000) {
        const t = Math.floor(n / 1000);
        const r = n % 1000;
        const thousands = t === 1 ? 'mille' : frBelowThousand(t) + ' mille';
        return r === 0 ? thousands : thousands + ' ' + frBelowThousand(r);
    }
    if (n < 1_000_000_000) {
        const m = Math.floor(n / 1_000_000);
        const r = n % 1_000_000;
        const millions = m === 1 ? 'un million' : frBelowThousand(m) + ' millions';
        return r === 0 ? millions : millions + ' ' + numberToFrench(r);
    }
    throw new Error('Number must be less than 1 billion');
}

function enBelowHundred(n: number): string {
    if (n < 20) return EN_UNITS[n]!;
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? EN_TENS[t]! : EN_TENS[t] + '-' + EN_UNITS[u];
}

function enBelowThousand(n: number): string {
    if (n < 100) return enBelowHundred(n);
    const h = Math.floor(n / 100);
    const r = n % 100;
    return r === 0 ? EN_UNITS[h] + ' hundred' : EN_UNITS[h] + ' hundred ' + enBelowHundred(r);
}

function numberToEnglish(n: number): string {
    if (n === 0) return 'zero';
    if (n < 0) return 'minus ' + numberToEnglish(-n);
    if (n < 1000) return enBelowThousand(n);
    if (n < 1_000_000) {
        const t = Math.floor(n / 1000);
        const r = n % 1000;
        return r === 0 ? enBelowThousand(t) + ' thousand' : enBelowThousand(t) + ' thousand ' + enBelowThousand(r);
    }
    if (n < 1_000_000_000) {
        const m = Math.floor(n / 1_000_000);
        const r = n % 1_000_000;
        return r === 0 ? enBelowThousand(m) + ' million' : enBelowThousand(m) + ' million ' + numberToEnglish(r);
    }
    throw new Error('Number must be less than 1 billion');
}

export function number(value: string, lang: string): string {
    const n = Number(value);
    if (isNaN(n)) throw new Error('Value must be a number');
    if (!Number.isInteger(n)) throw new Error('Value must be an integer');
    if (Math.abs(n) >= 1_000_000_000) throw new Error('Number must be less than 1 billion');

    switch (lang) {
        case 'fr':
            return numberToFrench(n);
        case 'en':
            return numberToEnglish(n);
        default:
            throw new Error('Lang must be one of: fr, en');
    }
}
