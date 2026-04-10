import { MAX_STRING_LENGTH } from '../../constants.js';

export interface StatisticsResult {
    count: number;
    sum: number;
    min: number;
    max: number;
    range: number;
    mean: number;
    median: number;
    mode: number[];
    variance: number;
    stddev: number;
}

export default function statistics(values: string): StatisticsResult {
    if (!values) throw new Error('A list of values is required');
    if (typeof values !== 'string') throw new Error('Values must be a comma-separated string');

    const arr = values.split(',').map((v) => Number(v.trim()));

    if (arr.some(isNaN)) throw new Error('Values must contain only numbers');
    if (arr.length < 1) throw new Error('At least one value is required');
    if (arr.length > MAX_STRING_LENGTH) throw new Error(`Cannot process more than ${MAX_STRING_LENGTH} values`);

    const count = arr.length;
    const sum = arr.reduce((a, b) => a + b, 0);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const mean = sum / count;

    const sorted = [...arr].sort((a, b) => a - b);
    const median = count % 2 === 0 ? (sorted[count / 2 - 1]! + sorted[count / 2]!) / 2 : sorted[Math.floor(count / 2)]!;

    const counts = new Map<number, number>();
    for (const n of arr) counts.set(n, (counts.get(n) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const mode = maxCount === 1 ? [] : [...counts.entries()].filter(([, c]) => c === maxCount).map(([n]) => n);

    const variance = arr.reduce((acc, n) => acc + (n - mean) ** 2, 0) / count;
    const stddev = Math.sqrt(variance);

    return {
        count,
        sum: +sum.toFixed(6),
        min,
        max,
        range: max - min,
        mean: +mean.toFixed(6),
        median: +median.toFixed(6),
        mode,
        variance: +variance.toFixed(6),
        stddev: +stddev.toFixed(6),
    };
}
