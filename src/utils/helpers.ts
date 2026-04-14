/**
 * Tracks requests per user and throws if the rate limit is exceeded.
 *
 * @param rateLimits - Store of timestamps per user
 * @param userId - Identifier of the requesting user
 * @param timestamp - Current timestamp in milliseconds
 * @param window - Time window in milliseconds
 * @param limit - Maximum requests allowed in the window
 * @returns false if within limits
 * @throws Error if rate limit is exceeded
 */
export function checkRateLimit(
    rateLimits: Record<string, number[]>,
    userId: string,
    timestamp: number,
    window = 10000,
    limit = 50,
): boolean {
    rateLimits[userId] = (rateLimits[userId] ?? []).filter((ts) => timestamp - ts < window);

    if (rateLimits[userId]!.length > limit) {
        const remainingTime = Math.ceil((rateLimits[userId]![0]! + window - timestamp) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${remainingTime} seconds.`);
    }

    rateLimits[userId]!.push(timestamp);
    return false;
}

/**
 * Parses a space-separated environment variable into an array.
 *
 * @param key - The environment variable name
 * @returns The parsed array, or null if not set
 */
export function envList(key: string): string[] | null {
    const v = process.env[key];
    return v && v !== 'undefined' ? v.split(' ') : null;
}

/**
 * Formats a Date to ISO string without timezone suffix.
 *
 * @param date - The date to format
 * @returns ISO-formatted string without trailing Z
 */
export function formatDate(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

/**
 * Generates a random IPv4 address.
 *
 * @returns A string in the format "X.X.X.X"
 */
export function genIP(): string {
    return `${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}`;
}

/**
 * Returns a random element from an array.
 *
 * @param arr - The source array
 * @returns A random element
 */
export function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Returns a random integer between min and max (inclusive).
 *
 * @param min - Lower bound
 * @param max - Upper bound
 * @returns A random integer in [min, max]
 */
export function randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if a version string is at least the given minimum.
 *
 * @param version - Version string (e.g. "v4")
 * @param min - Minimum version number
 * @returns true if the version is >= min
 */
export function since(version: string, min: number): boolean {
    return parseInt(version.replace('v', '')) >= min;
}
