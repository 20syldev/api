import { randomInt } from 'crypto';

import { MAX_PASSWORD_COUNT, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../../constants.js';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

const WORDLIST = [
    'apple',
    'brave',
    'chair',
    'dance',
    'eagle',
    'fancy',
    'grace',
    'house',
    'ivory',
    'joker',
    'kneel',
    'lemon',
    'maple',
    'noble',
    'ocean',
    'piano',
    'queen',
    'river',
    'stone',
    'tiger',
    'ultra',
    'vivid',
    'waste',
    'xenon',
    'yacht',
    'zebra',
    'amber',
    'blaze',
    'coral',
    'drift',
    'ember',
    'flora',
    'globe',
    'haven',
    'input',
    'jumpy',
    'karma',
    'lunar',
    'magic',
    'night',
    'optic',
    'proxy',
    'quirk',
    'radar',
    'solar',
    'trace',
    'umbra',
    'vapor',
    'witch',
    'xylem',
    'yield',
    'zippy',
    'alpha',
    'brisk',
    'crane',
    'depth',
    'event',
    'frost',
    'grime',
    'harsh',
    'index',
    'joint',
    'knack',
    'level',
    'minus',
    'nerve',
    'onset',
    'phase',
    'quest',
    'ratio',
    'scope',
    'trend',
    'union',
    'valve',
    'weary',
    'young',
    'blunt',
    'clean',
    'drive',
    'earth',
    'fiber',
    'grain',
    'grind',
    'horse',
    'ideal',
    'issue',
    'judge',
    'juice',
    'knave',
    'large',
    'laser',
    'light',
    'limit',
    'media',
    'merit',
    'metal',
    'model',
    'money',
    'month',
    'motor',
    'mount',
    'music',
    'nerve',
    'noise',
    'north',
    'noted',
    'novel',
    'nurse',
    'oasis',
    'offer',
    'olive',
    'omega',
    'other',
    'outer',
    'owner',
    'oxide',
    'ozone',
    'paint',
    'panel',
    'paper',
    'patch',
    'pause',
    'peace',
    'pearl',
    'pedal',
    'plain',
    'plank',
    'plant',
    'plate',
    'plaza',
    'pluck',
    'plumb',
    'plume',
    'plunge',
    'point',
    'polar',
    'power',
    'press',
    'pride',
    'prime',
    'print',
    'prism',
    'prize',
    'probe',
    'prone',
    'proof',
    'prose',
    'proud',
    'prove',
    'prowl',
    'pulse',
    'punch',
    'pupil',
    'purge',
    'swift',
    'sword',
    'table',
    'taint',
    'tally',
    'taste',
    'teach',
    'teeth',
    'tempo',
    'tense',
    'tenth',
    'terms',
    'terra',
    'thick',
    'thing',
    'think',
    'thorn',
    'three',
    'throw',
    'thumb',
    'tidal',
    'tight',
    'tilde',
    'timer',
    'title',
    'token',
    'torch',
    'total',
    'touch',
    'tough',
    'tower',
    'track',
    'trade',
    'trail',
    'train',
    'trait',
    'tramp',
    'tread',
    'treat',
    'trees',
    'trial',
    'tribe',
    'trick',
    'tried',
    'troop',
    'trove',
    'truce',
    'truck',
    'truly',
    'trunk',
    'truth',
    'tulip',
    'tumor',
    'tuner',
    'tunic',
    'tweak',
    'twice',
    'twirl',
    'twist',
    'typed',
    'under',
    'unify',
    'unite',
    'unity',
    'until',
    'upper',
    'upset',
    'urban',
    'usage',
    'valid',
    'value',
    'visor',
    'vital',
    'vivid',
    'vocab',
    'vocal',
    'voice',
    'voter',
    'vault',
    'venue',
    'verse',
    'watch',
    'water',
    'weave',
    'wedge',
    'weird',
    'wheel',
    'where',
    'which',
    'while',
    'white',
    'whole',
    'wider',
    'windy',
    'wired',
    'world',
    'worse',
    'worth',
    'would',
    'wound',
    'write',
    'wrong',
    'wrote',
    'years',
    'yield',
    'yours',
];

export interface PasswordResult {
    passwords: string[];
    type: string;
    length: number;
    strength: string;
    entropy: number;
}

function computeStrength(entropy: number): string {
    if (entropy < 40) return 'weak';
    if (entropy < 60) return 'moderate';
    if (entropy < 80) return 'strong';
    return 'very_strong';
}

function generateRandom(length: number, charset: string): string {
    return Array.from({ length }, () => charset[randomInt(charset.length)]).join('');
}

function generatePassphrase(wordCount: number, separator: string): string {
    return Array.from({ length: wordCount }, () => WORDLIST[randomInt(WORDLIST.length)]).join(separator);
}

/**
 * Generates one or more passwords using random characters or passphrase mode.
 *
 * @param type - Generation mode: "random" or "passphrase"
 * @param length - Password length for random mode (8–128), or word count for passphrase mode (3–10)
 * @param options - Character set options: uppercase, lowercase, digits, symbols, exclude, count, separator
 * @returns Generated passwords with type, length, strength and entropy
 * @throws Error if no charset is active, length is out of range, or count exceeds the maximum
 */
export default function password(
    type: string = 'random',
    length: number = 16,
    options: {
        uppercase?: boolean;
        lowercase?: boolean;
        digits?: boolean;
        symbols?: boolean;
        exclude?: string;
        count?: number;
        separator?: string;
    } = {},
): PasswordResult {
    const {
        uppercase = true,
        lowercase = true,
        digits = true,
        symbols = false,
        exclude = '',
        count = 1,
        separator = '-',
    } = options;

    if (count < 1 || count > MAX_PASSWORD_COUNT) {
        throw new Error(`Count must be between 1 and ${MAX_PASSWORD_COUNT}`);
    }

    if (type === 'passphrase') {
        const wordCount = Math.max(3, Math.min(10, length));
        const entropy = Math.log2(Math.pow(WORDLIST.length, wordCount));
        const passwords = Array.from({ length: count }, () => generatePassphrase(wordCount, separator));
        return {
            passwords,
            type: 'passphrase',
            length: wordCount,
            strength: computeStrength(entropy),
            entropy: Math.round(entropy * 10) / 10,
        };
    }

    if (type !== 'random') {
        throw new Error('Type must be "random" or "passphrase"');
    }

    if (isNaN(length) || length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
        throw new Error(`Length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}`);
    }

    let charset = '';
    if (uppercase) charset += UPPER;
    if (lowercase) charset += LOWER;
    if (digits) charset += DIGITS;
    if (symbols) charset += SYMBOLS;

    if (exclude) {
        for (const char of exclude) {
            charset = charset.replaceAll(char, '');
        }
    }

    if (charset.length === 0) {
        throw new Error('At least one character set must be enabled');
    }

    const entropy = Math.log2(Math.pow(charset.length, length));
    const passwords = Array.from({ length: count }, () => generateRandom(length, charset));

    return {
        passwords,
        type: 'random',
        length,
        strength: computeStrength(entropy),
        entropy: Math.round(entropy * 10) / 10,
    };
}
