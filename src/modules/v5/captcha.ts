import { createCanvas } from 'canvas';

import type { ChallengeStorage } from '../../types/storage.js';
import type { ChallengeVerification } from '../../utils/challenge.js';
import { signToken, verifyToken } from '../../utils/challenge.js';
import { normalizeColor } from '../../utils/colors.js';
import type { CaptchaOptions, CaptchaResult } from '../v4/captcha.js';

export interface CaptchaChallenge {
    contentType: string;
    body: Buffer;
    token: string;
}

const NOISE_LEVELS = new Set(['low', 'medium', 'high']);
const NOISE_CONFIG = { low: { lines: 8, dots: 80 }, medium: { lines: 25, dots: 300 }, high: { lines: 50, dots: 600 } };
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive'];
const STYLES = ['', 'bold ', 'italic ', 'bold italic '];

function generateText(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return result;
}

function clamp(value: number | undefined, name: string, def: number, min: number, max: number): number {
    if (value === undefined) return def;
    if (isNaN(value)) throw new Error(`${name} must be a number`);
    if (value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}`);
    return Math.floor(value);
}

const muted = (): string =>
    `rgb(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)})`;

/**
 * Renders a CAPTCHA hardened against OCR: glyphs overlap so they cannot be
 * segmented, ride a sine baseline with per-character shear, mix font families,
 * and are crossed by occlusion strokes drawn in the same colours as the text so
 * no colour filter can separate them. Reserved for challenge mode, where the
 * answer never leaves the server; the generator mode keeps the milder rendering.
 *
 * @param options - Captcha configuration options
 * @returns Object containing the PNG buffer, content type, and the challenge text
 * @throws Error if any option is out of the accepted range
 */
function hardened(options: CaptchaOptions): CaptchaResult {
    const text = options.text || generateText(clamp(options.length, 'length', 6, 1, 20));
    const height = clamp(options.height, 'height', 120, 50, 400);
    const width = clamp(options.width, 'width', text.length * 60, 100, 800);

    const noise = options.noise ?? 'medium';
    if (!NOISE_LEVELS.has(noise)) throw new Error('Noise must be one of: low, medium, high');
    const { lines, dots } = NOISE_CONFIG[noise];

    const bg = normalizeColor(options.bg, '#ffffff');
    const baseColor = options.color ? normalizeColor(options.color, '#000000') : undefined;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < lines; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${0.3 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.bezierCurveTo(
            Math.random() * width,
            Math.random() * height,
            Math.random() * width,
            Math.random() * height,
            Math.random() * width,
            Math.random() * height,
        );
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.stroke();
    }

    const baseFontSize = Math.floor(height * 0.5);
    const charWidth = width / (text.length * 0.68 + 0.6);

    for (let i = 0; i < Math.floor(text.length * 1.5); i++) {
        const size = Math.floor(baseFontSize * (0.4 + Math.random() * 0.3));
        ctx.font = `${size}px ${FONTS[Math.floor(Math.random() * FONTS.length)]}`;
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${0.15 + Math.random() * 0.15})`;
        ctx.fillText(
            CHARSET[Math.floor(Math.random() * CHARSET.length)]!,
            Math.random() * width,
            Math.random() * height,
        );
    }

    const phase = Math.random() * Math.PI * 2;
    const freq = 0.6 + Math.random() * 0.8;
    const colors: string[] = [];
    let x = charWidth * 0.25;

    for (let i = 0; i < text.length; i++) {
        const size = Math.floor(baseFontSize * (0.8 + Math.random() * 0.4));
        const y = height / 2 + Math.sin(phase + i * freq) * height * 0.12;
        const color = baseColor ?? muted();
        colors.push(color);

        ctx.font = `${STYLES[Math.floor(Math.random() * STYLES.length)]}${size}px ${FONTS[Math.floor(Math.random() * FONTS.length)]}`;
        ctx.save();
        ctx.translate(x + charWidth / 2, y);
        ctx.rotate((Math.random() - 0.5) * 1.2);
        ctx.transform(1, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.6, 1, 0, 0);

        if (i % 3 === 1) {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, size * 0.04);
            ctx.strokeText(text[i]!, -charWidth / 2, 0);
        } else {
            ctx.fillStyle = color;
            ctx.fillText(text[i]!, -charWidth / 2, 0);
        }

        ctx.restore();
        x += charWidth * (0.55 + Math.random() * 0.15);
    }

    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)]!;
        ctx.lineWidth = Math.max(1, baseFontSize * 0.05);
        ctx.beginPath();
        const band = (): number => height * 0.3 + Math.random() * height * 0.4;
        ctx.moveTo(0, band());
        ctx.bezierCurveTo(width * 0.3, band(), width * 0.6, band(), width, band());
        ctx.stroke();
    }

    for (let i = 0; i < dots; i++) {
        ctx.fillStyle =
            Math.random() < 0.5
                ? colors[Math.floor(Math.random() * colors.length)]!
                : `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${0.4 + Math.random() * 0.5})`;
        const dotSize = 1 + Math.random() * 2;
        ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), dotSize, dotSize);
    }

    return { contentType: 'image/png', body: canvas.toBuffer('image/png'), text };
}

/**
 * Generates a hardened captcha whose answer is bound to a signed token instead
 * of being returned in clear. The answer lives only inside the HMAC, so the
 * caller holds a token it cannot read the solution from.
 *
 * @param options - Captcha configuration options
 * @returns PNG buffer, content type, and the token to verify the answer against
 * @throws Error if any option is out of the accepted range
 */
export default function captchaChallenge(options: CaptchaOptions): CaptchaChallenge {
    const { contentType, body, text } = hardened(options);
    return { contentType, body, token: signToken('img', text.toLowerCase()) };
}

/**
 * Verifies a captcha answer against its token, then consumes the token.
 *
 * @param token - Token issued alongside the challenge image
 * @param answer - Answer read by the user, compared case-insensitively
 * @param storage - Store of already consumed nonces
 * @returns Verification result, with a reason when it fails
 */
export function verifyCaptcha(token: string, answer: string, storage: ChallengeStorage): ChallengeVerification {
    return verifyToken(token, answer.trim().toLowerCase(), storage);
}
