import { getHashes, createHash } from 'crypto';

export default function hash(text, method) {
    const methods = getHashes();
    if (!methods.includes(method)) return { error: `Unsupported method. Use one of: ${methods.join(', ')}` };

    const hash = createHash(method).update(text).digest('hex');
    return { method, hash };
}