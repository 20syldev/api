import { type CipherGCM, createCipheriv, createDecipheriv, type DecipherGCM, randomBytes, scryptSync } from 'crypto';

import { MAX_STRING_LENGTH } from '../../constants.js';

export interface EncryptResult {
    action: string;
    algorithm: string;
    result: string;
}

const ALGORITHMS: Record<string, { keyLength: number; ivLength: number; authTag: boolean }> = {
    'aes-256-gcm': { keyLength: 32, ivLength: 12, authTag: true },
    'aes-256-cbc': { keyLength: 32, ivLength: 16, authTag: false },
    'aes-128-gcm': { keyLength: 16, ivLength: 12, authTag: true },
};

/**
 * Encrypts or decrypts text using AES with key derivation via scrypt.
 *
 * @param action - "encrypt" or "decrypt"
 * @param text - Text to encrypt, or base64 blob to decrypt
 * @param key - User-provided key (min 8 characters)
 * @param algorithm - Cipher algorithm (default: aes-256-gcm)
 * @returns Object containing action, algorithm, and base64 result
 */
export default function encrypt(
    action: string,
    text: string,
    key: string,
    algorithm: string = 'aes-256-gcm',
): EncryptResult {
    if (!action || (action !== 'encrypt' && action !== 'decrypt'))
        throw new Error('Action must be "encrypt" or "decrypt"');
    if (!text) throw new Error('Text is required');
    if (!key) throw new Error('Key is required');
    if (key.length < 8) throw new Error('Key must be at least 8 characters');
    if (action === 'encrypt' && text.length > MAX_STRING_LENGTH)
        throw new Error(`Text exceeds maximum length of ${MAX_STRING_LENGTH}`);

    const algo = ALGORITHMS[algorithm];
    if (!algo) throw new Error(`Unsupported algorithm. Use one of: ${Object.keys(ALGORITHMS).join(', ')}`);

    if (action === 'encrypt') {
        const salt = randomBytes(16);
        const iv = randomBytes(algo.ivLength);
        const derivedKey = scryptSync(key, salt, algo.keyLength);
        const cipher = createCipheriv(algorithm, derivedKey, iv);

        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

        let blob: Buffer;
        if (algo.authTag) {
            const tag = (cipher as CipherGCM).getAuthTag();
            blob = Buffer.concat([salt, iv, tag, encrypted]);
        } else {
            blob = Buffer.concat([salt, iv, encrypted]);
        }

        return { action, algorithm, result: blob.toString('base64') };
    } else {
        const data = Buffer.from(text, 'base64');
        const salt = data.subarray(0, 16);
        const iv = data.subarray(16, 16 + algo.ivLength);

        let tagEnd = 16 + algo.ivLength;
        let tag: Buffer | null = null;
        if (algo.authTag) {
            tag = data.subarray(tagEnd, tagEnd + 16);
            tagEnd += 16;
        }
        const ciphertext = data.subarray(tagEnd);

        try {
            const derivedKey = scryptSync(key, salt, algo.keyLength);
            const decipher = createDecipheriv(algorithm, derivedKey, iv);
            if (tag) (decipher as DecipherGCM).setAuthTag(tag);
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return { action, algorithm, result: decrypted.toString('utf8') };
        } catch {
            throw new Error('Invalid key or corrupted data');
        }
    }
}
