export function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genIP(): string {
    return `${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}`;
}

export function formatDate(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

export function envList(key: string): string[] | null {
    const v = process.env[key];
    return v && v !== 'undefined' ? v.split(' ') : null;
}

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
