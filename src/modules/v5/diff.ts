import { MAX_DIFF_LENGTH, MAX_DIFF_PARTS } from '../../constants.js';

export interface DiffChange {
    type: 'equal' | 'add' | 'del';
    value: string;
}

export interface DiffResult {
    mode: string;
    added: number;
    removed: number;
    changes: DiffChange[];
}

type Mode = 'line' | 'word';

const VALID_MODES: Mode[] = ['line', 'word'];

function split(text: string, mode: Mode): string[] {
    if (mode === 'line') return text.split('\n');
    return text.split(/\s+/).filter((w) => w.length > 0);
}

function lcs(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i]![j] = dp[i - 1]![j - 1]! + 1;
            } else {
                dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
            }
        }
    }

    return dp;
}

function buildChanges(a: string[], b: string[], dp: number[][]): DiffChange[] {
    const changes: DiffChange[] = [];
    let i = a.length;
    let j = b.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            changes.push({ type: 'equal', value: a[i - 1]! });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
            changes.push({ type: 'add', value: b[j - 1]! });
            j--;
        } else {
            changes.push({ type: 'del', value: a[i - 1]! });
            i--;
        }
    }

    return changes.reverse();
}

/**
 * Compares two texts and returns a structured diff using the LCS algorithm.
 *
 * @param a - Original text
 * @param b - Modified text
 * @param mode - Granularity: line (default) or word
 * @returns Diff result with the change list and added/removed counts
 * @throws Error if a text is missing or too long, or if the mode is invalid
 */
export default function diff(a: string, b: string, mode: string = 'line'): DiffResult {
    if (typeof a !== 'string') throw new Error('Please provide a first text (a={text})');
    if (typeof b !== 'string') throw new Error('Please provide a second text (b={text})');
    if (a.length > MAX_DIFF_LENGTH) throw new Error(`Texts must be ${MAX_DIFF_LENGTH} characters or fewer`);
    if (b.length > MAX_DIFF_LENGTH) throw new Error(`Texts must be ${MAX_DIFF_LENGTH} characters or fewer`);
    if (!VALID_MODES.includes(mode as Mode)) throw new Error(`Mode must be one of: ${VALID_MODES.join(', ')}`);

    const left = split(a, mode as Mode);
    const right = split(b, mode as Mode);
    if (left.length > MAX_DIFF_PARTS || right.length > MAX_DIFF_PARTS) {
        throw new Error(`Texts must contain ${MAX_DIFF_PARTS} ${mode}s or fewer`);
    }

    const changes = buildChanges(left, right, lcs(left, right));

    let added = 0;
    let removed = 0;
    for (const change of changes) {
        if (change.type === 'add') added++;
        else if (change.type === 'del') removed++;
    }

    return { mode, added, removed, changes };
}
