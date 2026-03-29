import { randomBytes } from 'crypto';
import { v4 } from 'uuid';
import { MIN_TOKEN_LENGTH, MAX_TOKEN_LENGTH } from '../../constants.js';

export default function token(len: number, type: string = 'alphanum'): string {
    if (isNaN(len) || len < MIN_TOKEN_LENGTH) {
        throw new Error('Length must be a number greater than or equal to 12');
    }

    if (len > MAX_TOKEN_LENGTH) {
        throw new Error('Length cannot exceed 4096');
    }

    const genToken = (chars: string, length: number): string => {
        return Array.from({ length }, () => {
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
    };

    const tokenTypes: Record<string, () => string> = {
        alpha: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', len),
        alphanum: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len),
        base64: () =>
            randomBytes(Math.ceil(len * 0.75))
                .toString('base64')
                .slice(0, len),
        hex: () =>
            randomBytes(Math.ceil(len * 0.5))
                .toString('hex')
                .slice(0, len),
        num: () => genToken('0123456789', len),
        punct: () => genToken('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', len),
        urlsafe: () => genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', len),
        uuid: () => v4().replace(/-/g, '').slice(0, len),
    };

    const lowerType = type.toLowerCase();
    if (!tokenTypes[lowerType]) {
        throw new Error(`Invalid token type. Valid types: ${Object.keys(tokenTypes).join(', ')}`);
    }

    return tokenTypes[lowerType]!();
}
