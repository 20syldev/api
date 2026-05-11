import { createHash, randomUUID } from 'node:crypto';

import { createCanvas } from 'canvas';

import { hslToRgb, normalizeColor, rgbToHex } from '../../utils/colors.js';

export interface AvatarOptions {
    seed?: string;
    size?: number;
    type?: string;
    bg?: string;
    format?: string;
}

export interface AvatarResult {
    contentType: string;
    body: Buffer | string;
}

type AvatarType = 'identicon' | 'pixel';
type AvatarFormat = 'png' | 'svg';

const VALID_TYPES: AvatarType[] = ['identicon', 'pixel'];
const VALID_FORMATS: AvatarFormat[] = ['png', 'svg'];
const MIN_SIZE = 50;
const MAX_SIZE = 2000;

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function hashSeed(seed: string): Buffer {
    return createHash('sha256').update(seed).digest();
}

function fgColor(hash: Buffer): string {
    const h = (hash[16]! / 255) * 360;
    const s = 0.5 + (hash[17]! / 255) * 0.3;
    const l = 0.4 + (hash[18]! / 255) * 0.2;
    const [r, g, b] = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

function identicon(hash: Buffer, size: number, bg: string, format: AvatarFormat): Buffer | string {
    const GRID = 5;
    const cell = size / GRID;
    const fg = fgColor(hash);

    // 15 cells: columns 0-2 (column 2 is center, 0 mirrors 4, 1 mirrors 3)
    const cells: boolean[][] = Array.from({ length: GRID }, () => new Array<boolean>(GRID).fill(false));
    let bitIndex = 0;
    for (let col = 0; col < 3; col++) {
        for (let row = 0; row < GRID; row++) {
            const byteIndex = Math.floor(bitIndex / 8);
            const bitPos = 7 - (bitIndex % 8);
            const on = ((hash[byteIndex]! >> bitPos) & 1) === 1;
            cells[row]![col] = on;
            cells[row]![GRID - 1 - col] = on;
            bitIndex++;
        }
    }

    if (format === 'svg') {
        const rects: string[] = [];
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (cells[row]![col]) {
                    rects.push(
                        `<rect x="${col * cell}" y="${row * cell}" width="${cell}" height="${cell}" fill="${fg}" />`,
                    );
                }
            }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}" />${rects.join('')}</svg>`;
    }

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            if (cells[row]![col]) {
                ctx.fillRect(Math.round(col * cell), Math.round(row * cell), Math.round(cell), Math.round(cell));
            }
        }
    }
    return canvas.toBuffer('image/png');
}

function pixel(hash: Buffer, size: number, bg: string, format: AvatarFormat): Buffer | string {
    const GRID = 8;
    const cell = size / GRID;

    // Derive a small palette from the hash
    const palette: string[] = [];
    for (let i = 0; i < 3; i++) {
        const h = ((hash[i * 3]! / 255) * 360 + i * 120) % 360;
        const s = 0.5 + (hash[i * 3 + 1]! / 255) * 0.3;
        const l = 0.4 + (hash[i * 3 + 2]! / 255) * 0.2;
        const [r, g, b] = hslToRgb(h, s, l);
        palette.push(rgbToHex(r, g, b));
    }

    // Use individual bits: 32 bytes × 8 bits = 256 bits, enough for 64 cells
    const isOn = (i: number) => ((hash[Math.floor(i / 8)]! >> (7 - (i % 8))) & 1) === 1;
    const colorOf = (i: number) => palette[hash[Math.floor(i / 8)]! % palette.length]!;

    if (format === 'svg') {
        const rects: string[] = [];
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                const i = row * GRID + col;
                if (isOn(i)) {
                    rects.push(
                        `<rect x="${col * cell}" y="${row * cell}" width="${cell}" height="${cell}" fill="${colorOf(i)}" />`,
                    );
                }
            }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}" />${rects.join('')}</svg>`;
    }

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            const i = row * GRID + col;
            if (isOn(i)) {
                ctx.fillStyle = colorOf(i);
                ctx.fillRect(Math.round(col * cell), Math.round(row * cell), Math.round(cell), Math.round(cell));
            }
        }
    }
    return canvas.toBuffer('image/png');
}

/**
 * Generates a deterministic identicon or pixel-art avatar from a seed string.
 *
 * @param options.seed - Seed string (default: random UUID)
 * @param options.size - Output size in px (50–500, default 200)
 * @param options.type - Avatar style: identicon or pixel (default: identicon)
 * @param options.bg - Background hex color (default: #f0f0f0)
 * @param options.format - Output format: png or svg (default: png)
 * @returns Object with contentType and body (Buffer for PNG, string for SVG)
 * @throws Error if type, format, or size is invalid
 */
export default function avatar(options: AvatarOptions = {}): AvatarResult {
    const seed = options.seed || randomUUID();
    const size = clamp(options.size !== undefined ? Math.round(options.size) : 200, MIN_SIZE, MAX_SIZE);
    const type = (options.type ?? 'identicon') as AvatarType;
    const format = (options.format ?? 'png') as AvatarFormat;
    const bg = normalizeColor(options.bg, '#f0f0f0');

    if (options.size !== undefined && (options.size < MIN_SIZE || options.size > MAX_SIZE)) {
        throw new Error(`Size must be between ${MIN_SIZE} and ${MAX_SIZE}`);
    }
    if (!VALID_TYPES.includes(type)) {
        throw new Error(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (!VALID_FORMATS.includes(format)) {
        throw new Error(`Format must be one of: ${VALID_FORMATS.join(', ')}`);
    }

    const hash = hashSeed(seed);
    const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';
    const body = type === 'identicon' ? identicon(hash, size, bg, format) : pixel(hash, size, bg, format);

    return { contentType, body };
}
