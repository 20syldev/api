import { MAX_STRING_LENGTH } from '../../constants.js';

export interface CaseResult {
    text: string;
    to: string;
    result: string;
}

const VALID_TARGETS = ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'sentence', 'upper', 'lower'] as const;
type CaseTarget = (typeof VALID_TARGETS)[number];

const capitalize = (w: string): string => w.charAt(0).toUpperCase() + w.slice(1);

const tokenize = (text: string): string[] =>
    text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.toLowerCase());

/**
 * Converts text to the specified case format.
 * Supports: camel, pascal, snake, kebab, constant, title, sentence, upper, lower.
 */
export default function caseConvert(text: string, to: string = 'camel'): CaseResult {
    if (!text) throw new Error('Please provide a text (?text={text})');
    if (text.length > MAX_STRING_LENGTH) throw new Error(`Text cannot exceed ${MAX_STRING_LENGTH} characters`);
    if (!VALID_TARGETS.includes(to as CaseTarget))
        throw new Error(`Invalid target case. Valid values: ${VALID_TARGETS.join(', ')}`);

    const words = tokenize(text);
    let result: string;

    switch (to as CaseTarget) {
        case 'camel':
            result = words[0]! + words.slice(1).map(capitalize).join('');
            break;
        case 'pascal':
            result = words.map(capitalize).join('');
            break;
        case 'snake':
            result = words.join('_');
            break;
        case 'kebab':
            result = words.join('-');
            break;
        case 'constant':
            result = words.join('_').toUpperCase();
            break;
        case 'title':
            result = words.map(capitalize).join(' ');
            break;
        case 'sentence':
            result = capitalize(words[0]!) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
            break;
        case 'upper':
            result = text.toUpperCase();
            break;
        case 'lower':
            result = text.toLowerCase();
            break;
    }

    return { text, to, result: result! };
}
