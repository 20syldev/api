import { getHashes, createHash } from 'crypto';

export default function hash(text: string, method: string): { method: string; hash: string } | { error: string } {
    const methods = getHashes();
    if (!methods.includes(method)) return { error: `Unsupported method. Use one of: ${methods.join(', ')}` };

    const result = createHash(method).update(text).digest('hex');
    return { method, hash: result };
}
