import { MAX_PATTERN_LENGTH, MAX_REGEX_MATCHES, MAX_STRING_LENGTH } from '../../constants.js';

const VALID_FLAGS = new Set(['g', 'i', 'm', 's', 'u']);

export interface RegexMatch {
    match: string;
    index: number;
    groups: string[];
    namedGroups: Record<string, string>;
}

export interface RegexResult {
    valid: boolean;
    pattern: string;
    flags: string;
    matches: RegexMatch[];
    count: number;
}

/**
 * Tests a regular expression pattern against a text and returns structured match results.
 *
 * @param pattern - The regex pattern to test (max 200 characters)
 * @param text - The text to match against (max 1000 characters)
 * @param flags - Optional regex flags; only g, i, m, s, u are accepted (g is always forced)
 * @returns Match results with groups and named groups, or { valid: false } if the pattern is invalid
 * @throws Error if pattern or text is missing or exceeds the maximum length
 */
export default function regex(pattern: string, text: string, flags: string = 'g'): RegexResult {
    if (!pattern) {
        throw new Error('Please provide a pattern (?pattern={regex})');
    }
    if (!text) {
        throw new Error('Please provide a text (&text={string})');
    }
    if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new Error(`Pattern must be under ${MAX_PATTERN_LENGTH} characters`);
    }
    if (text.length > MAX_STRING_LENGTH) {
        throw new Error(`Text must be under ${MAX_STRING_LENGTH} characters`);
    }

    const cleanedFlags = [...new Set(['g', ...flags.split('').filter((f) => VALID_FLAGS.has(f))])].join('');

    let re: RegExp;
    try {
        re = new RegExp(pattern, cleanedFlags);
    } catch {
        return { valid: false, pattern, flags: cleanedFlags, matches: [], count: 0 };
    }

    const matches: RegexMatch[] = [];
    let result: RegExpExecArray | null;

    while ((result = re.exec(text)) !== null && matches.length < MAX_REGEX_MATCHES) {
        matches.push({
            match: result[0],
            index: result.index,
            groups: result.slice(1).map((g) => g ?? ''),
            namedGroups: result.groups ? { ...result.groups } : {},
        });
        // Prevent infinite loop on zero-length matches
        if (result[0].length === 0) re.lastIndex++;
    }

    return { valid: true, pattern, flags: cleanedFlags, matches, count: matches.length };
}
