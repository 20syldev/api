import { randomUUID } from 'node:crypto';

import { MAX_UUID_COUNT } from '../../constants.js';

export interface UuidGenerateResult {
    uuid: string;
    version: number;
    variant: string;
}

export interface UuidGenerateBatchResult {
    uuids: string[];
    count: number;
}

export interface UuidParseResult {
    uuid: string;
    version: number | null;
    variant: string | null;
    valid: boolean;
}

export type UuidResult = UuidGenerateResult | UuidGenerateBatchResult | UuidParseResult;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function variantOf(input: string): string {
    const bits = parseInt(input[19]!, 16);
    if (bits < 8) return 'NCS';
    if (bits < 12) return 'RFC 4122';
    if (bits < 14) return 'Microsoft';
    return 'Future';
}

/**
 * Generates random UUID v4 values or parses an existing UUID.
 *
 * @param input - UUID to parse; when omitted, a random UUID v4 is generated
 * @param count - Number of UUIDs to generate (1-50), ignored when input is provided
 * @returns Parsed components, a single generated UUID, or a batch of generated UUIDs
 * @throws Error if count is not a number or out of range
 */
export default function uuid(input?: string, count?: number): UuidResult {
    if (input) {
        if (!UUID_REGEX.test(input)) return { uuid: input, version: null, variant: null, valid: false };
        return { uuid: input, version: parseInt(input[14]!, 16), variant: variantOf(input), valid: true };
    }

    if (count !== undefined) {
        if (isNaN(count)) throw new Error('Count must be a number');
        if (!Number.isInteger(count) || count < 1 || count > MAX_UUID_COUNT) {
            throw new Error(`Count must be between 1 and ${MAX_UUID_COUNT}`);
        }
    }

    const total = count ?? 1;
    if (total > 1) return { uuids: Array.from({ length: total }, () => randomUUID()), count: total };

    return { uuid: randomUUID(), version: 4, variant: 'RFC 4122' };
}
