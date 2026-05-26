import { createCanvas } from 'canvas';

import { normalizeColor } from '../../utils/colors.js';

export interface CaptchaOptions {
    text?: string;
    length?: number;
    width?: number;
    height?: number;
    noise?: 'low' | 'medium' | 'high';
    bg?: string;
    color?: string;
}

export interface CaptchaResult {
    contentType: string;
    body: Buffer;
    text: string;
}

const NOISE_LEVELS = new Set(['low', 'medium', 'high']);
const NOISE_CONFIG = { low: { lines: 8, dots: 80 }, medium: { lines: 25, dots: 300 }, high: { lines: 50, dots: 600 } };
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

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

/**
 * Generates a CAPTCHA image with random or custom text and configurable noise.
 *
 * @param options - Captcha configuration options
 * @returns Object containing the PNG buffer, content type, and the challenge text
 * @throws Error if any option is out of the accepted range
 */
export default function captcha(options: CaptchaOptions): CaptchaResult {
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
        const x0 = Math.random() * width,
            y0 = Math.random() * height;
        ctx.moveTo(x0, y0);
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
    const charWidth = width / (text.length + 0.5);
    let x = charWidth * 0.25;

    for (let i = 0; i < text.length; i++) {
        const size = Math.floor(baseFontSize * (0.8 + Math.random() * 0.4));
        const y = height / 2 + (Math.random() - 0.5) * height * 0.3;

        ctx.font = `${size}px Comic Sans Ms`;
        if (baseColor) {
            ctx.fillStyle = baseColor;
        } else {
            ctx.fillStyle = `rgb(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)})`;
        }

        ctx.save();
        ctx.translate(x + charWidth / 2, y);
        ctx.rotate((Math.random() - 0.5) * 1.2);
        ctx.fillText(text[i]!, -charWidth / 2, 0);
        ctx.restore();

        x += charWidth;
    }

    for (let i = 0; i < dots; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${0.4 + Math.random() * 0.5})`;
        const dotSize = 1 + Math.random() * 2;
        ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), dotSize, dotSize);
    }

    return { contentType: 'image/png', body: canvas.toBuffer('image/png'), text };
}
