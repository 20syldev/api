import { MAX_READ_LENGTH } from '../../constants.js';

export interface ReadResult {
    lang: string;
    words: number;
    sentences: number;
    syllables: number;
    fleschReadingEase: number;
    fleschKincaidGrade: number | null;
    readingTime: string;
}

const LANGUAGES = ['en', 'fr'];

// English heuristic: vowel groups minus silent trailing "e", at least one syllable.
function countSyllablesEn(word: string): number {
    const groups = word
        .toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/e$/, '')
        .match(/[aeiouy]+/g);
    return Math.max(1, groups ? groups.length : 1);
}

// French heuristic: accented vowels count as vowels, a trailing "e"/"es" is silent.
function countSyllablesFr(word: string): number {
    const groups = word
        .toLowerCase()
        .replace(/[^a-zàâäéèêëîïôöùûüÿç]/g, '')
        .replace(/es?$/, '')
        .match(/[aeiouyàâäéèêëîïôöùûüÿ]+/g);
    return Math.max(1, groups ? groups.length : 1);
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Computes Flesch readability scores on a text. English uses the original
 * Flesch coefficients; French uses the Kandel & Moles adaptation, which has no
 * grade-level counterpart, so fleschKincaidGrade is null for French.
 *
 * @param text - The text to analyze
 * @param lang - Language of the text: en (default) or fr
 * @returns Word, sentence and syllable counts, Flesch scores and estimated reading time
 * @throws Error if the text is missing or too long, or if the language is unsupported
 */
export default function read(text: string, lang: string = 'en'): ReadResult {
    if (!text || !text.trim()) throw new Error('Please provide a text');
    if (text.length > MAX_READ_LENGTH) throw new Error(`Text must be ${MAX_READ_LENGTH} characters or fewer`);
    if (!LANGUAGES.includes(lang)) throw new Error(`Language must be one of: ${LANGUAGES.join(', ')}`);

    const wordList = text
        .trim()
        .split(/\s+/)
        .filter((w) => /[\p{L}\p{N}]/u.test(w));
    const words = wordList.length;
    if (words === 0) throw new Error('Please provide a text');

    const sentences = text.split(/[.!?…]+/).filter((s) => s.trim()).length || 1;
    const countSyllables = lang === 'fr' ? countSyllablesFr : countSyllablesEn;
    const syllables = wordList.reduce((sum, word) => sum + countSyllables(word), 0);

    const wordsPerSentence = words / sentences;
    const syllablesPerWord = syllables / words;
    const fleschReadingEase =
        lang === 'fr'
            ? round2(207 - 1.015 * wordsPerSentence - 73.6 * syllablesPerWord)
            : round2(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord);
    const fleschKincaidGrade = lang === 'fr' ? null : round2(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59);

    const minutes = words / 200;
    const readingTime = minutes < 1 ? `${Math.ceil(minutes * 60)}s` : `${Math.round(minutes)}min`;

    return { lang, words, sentences, syllables, fleschReadingEase, fleschKincaidGrade, readingTime };
}
