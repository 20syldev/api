import { createHmac, randomBytes } from 'crypto';

export interface OtpSecretResult {
    secret: string;
    uri: string;
}

export interface OtpGenerateResult {
    code: string;
    remaining: number;
    period: number;
}

export interface OtpVerifyResult {
    valid: boolean;
    drift: number;
}

// ─── Base32 ───
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encodeBase32(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let result = '';
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            result += BASE32_CHARS[(value >>> bits) & 0x1f];
        }
    }
    if (bits > 0) {
        result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
    }
    return result;
}

function decodeBase32(encoded: string): Buffer {
    const cleaned = encoded.replace(/=+$/, '').toUpperCase();
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];
    for (const char of cleaned) {
        const idx = BASE32_CHARS.indexOf(char);
        if (idx === -1) throw new Error('Invalid base32 character');
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((value >>> bits) & 0xff);
        }
    }
    return Buffer.from(bytes);
}

// ─── HOTP ───
function generateHotp(secret: Buffer, counter: bigint, algorithm: string, digits: number): string {
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(counter);

    const hmac = createHmac(algorithm, secret).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1]! & 0x0f;
    const binary =
        ((hmac[offset]! & 0x7f) << 24) |
        ((hmac[offset + 1]! & 0xff) << 16) |
        ((hmac[offset + 2]! & 0xff) << 8) |
        (hmac[offset + 3]! & 0xff);

    const otp = binary % 10 ** digits;
    return otp.toString().padStart(digits, '0');
}

// ─── Main ───
const VALID_ALGORITHMS = new Set(['sha1', 'sha256', 'sha512']);
const VALID_DIGITS = new Set([6, 8]);
const VALID_PERIODS = new Set([15, 30, 60]);

/**
 * Generates or verifies TOTP/HOTP codes (RFC 4226 / RFC 6238).
 *
 * @param action - "secret", "generate", or "verify"
 * @param options - Configuration options
 * @returns Result depending on action
 */
export default function otp(
    action: string,
    options: {
        secret?: string;
        code?: string;
        algorithm?: string;
        digits?: number;
        period?: number;
        counter?: number;
        label?: string;
        issuer?: string;
    } = {},
): OtpSecretResult | OtpGenerateResult | OtpVerifyResult {
    if (!action || !['secret', 'generate', 'verify'].includes(action))
        throw new Error('Action must be "secret", "generate", or "verify"');

    const algorithm = options.algorithm ?? 'sha1';
    const digits = options.digits ?? 6;
    const period = options.period ?? 30;

    if (!VALID_ALGORITHMS.has(algorithm))
        throw new Error(`Algorithm must be one of: ${[...VALID_ALGORITHMS].join(', ')}`);
    if (!VALID_DIGITS.has(digits)) throw new Error('Digits must be 6 or 8');
    if (!VALID_PERIODS.has(period)) throw new Error('Period must be 15, 30, or 60');

    if (action === 'secret') {
        const label = options.label ?? 'user';
        const issuer = options.issuer ?? 'API';
        const secretBuf = randomBytes(20);
        const secret = encodeBase32(secretBuf);
        const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm.toUpperCase()}&digits=${digits}&period=${period}`;
        return { secret, uri };
    }

    if (!options.secret) throw new Error('Secret is required for generate/verify');
    const secretBuf = decodeBase32(options.secret);

    if (action === 'generate') {
        const counter =
            options.counter !== undefined ? BigInt(options.counter) : BigInt(Math.floor(Date.now() / 1000 / period));
        const code = generateHotp(secretBuf, counter, algorithm, digits);
        const remaining = options.counter !== undefined ? period : period - (Math.floor(Date.now() / 1000) % period);
        return { code, remaining, period };
    }

    // action === 'verify'
    if (!options.code) throw new Error('Code is required for verify');
    const currentCounter =
        options.counter !== undefined ? BigInt(options.counter) : BigInt(Math.floor(Date.now() / 1000 / period));

    for (let drift = 0; drift <= 1; drift++) {
        const code = generateHotp(secretBuf, currentCounter - BigInt(drift), algorithm, digits);
        if (code === options.code) return { valid: true, drift: drift === 0 ? 0 : -drift };
    }
    for (let drift = 1; drift <= 1; drift++) {
        const code = generateHotp(secretBuf, currentCounter + BigInt(drift), algorithm, digits);
        if (code === options.code) return { valid: true, drift };
    }

    return { valid: false, drift: 0 };
}
