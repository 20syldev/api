/**
 * Calculate the Levenshtein distance between two strings.
 *
 * @param {string} str1 - The first string
 * @param {string} str2 - The second string
 * @returns {object} - Object containing the strings and their Levenshtein distance
 * @throws {Error} - If inputs are invalid
 */
export default function levenshtein(str1, str2) {
    // Input validation
    if (!str1 || typeof str1 !== 'string') {
        throw new Error('Please provide a valid first string');
    }

    if (!str2 || typeof str2 !== 'string') {
        throw new Error('Please provide a valid second string');
    }

    if (str1.length > 1000) {
        throw new Error('First string exceeds 1000 characters');
    }

    if (str2.length > 1000) {
        throw new Error('Second string exceeds 1000 characters');
    }

    // Calculate Levenshtein distance
    const m = Array.from({ length: str1.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= str2.length; j++) m[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            m[i][j] = Math.min(
                m[i - 1][j] + 1,
                m[i][j - 1] + 1,
                m[i - 1][j - 1] + (str1[i - 1] !== str2[j - 1] ? 1 : 0)
            );
        }
    }

    return {
        str1,
        str2,
        distance: m[str1.length][str2.length]
    };
}