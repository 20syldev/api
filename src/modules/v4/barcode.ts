import { createCanvas } from 'canvas';

import { normalizeColor } from '../../utils/colors.js';

export interface BarcodeOptions {
    data: string;
    type?: string;
    width?: number;
    height?: number;
    format?: string;
    color?: string;
    bg?: string;
}

export interface BarcodeResult {
    contentType: string;
    body: Buffer | string;
}

type BarcodeType = 'code128' | 'ean13' | 'ean8' | 'upca' | 'code39';
type BarcodeFormat = 'svg' | 'png';

const VALID_TYPES: BarcodeType[] = ['code128', 'ean13', 'ean8', 'upca', 'code39'];
const VALID_FORMATS: BarcodeFormat[] = ['svg', 'png'];

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(val)));
}

// ─── Code 128 Set B ──────────────────────────────────────────────────────────
// Each entry: 6 bar/space widths (alternating bar, space, ...) summing to 11 modules
// Values 0-106 map to: value 0 = space (ASCII 32), ..., value 94 = ~ (ASCII 126)
// Values 95-106 are special chars (start A/B/C, code A/B/C, shift, stop, etc.)
const C128_PATTERNS: number[][] = [
    [2, 1, 2, 2, 2, 2],
    [2, 2, 2, 1, 2, 2],
    [2, 2, 2, 2, 2, 1],
    [1, 2, 1, 2, 2, 3],
    [1, 2, 1, 3, 2, 2],
    [1, 3, 1, 2, 2, 2],
    [1, 2, 2, 2, 1, 3],
    [1, 2, 2, 3, 1, 2],
    [1, 3, 2, 2, 1, 2],
    [2, 2, 1, 2, 1, 3],
    [2, 2, 1, 3, 1, 2],
    [2, 3, 1, 2, 1, 2],
    [1, 1, 2, 2, 3, 2],
    [1, 2, 2, 1, 3, 2],
    [1, 2, 2, 2, 3, 1],
    [1, 1, 3, 2, 2, 2],
    [1, 2, 3, 1, 2, 2],
    [1, 2, 3, 2, 2, 1],
    [2, 2, 3, 2, 1, 1],
    [2, 2, 1, 1, 3, 2],
    [2, 2, 1, 2, 3, 1],
    [2, 1, 3, 2, 1, 2],
    [2, 2, 3, 1, 1, 2],
    [3, 1, 2, 1, 3, 1],
    [3, 1, 1, 2, 2, 2],
    [3, 2, 1, 1, 2, 2],
    [3, 2, 1, 2, 2, 1],
    [3, 1, 2, 2, 1, 2],
    [3, 2, 2, 1, 1, 2],
    [3, 2, 2, 2, 1, 1],
    [2, 1, 2, 1, 2, 3],
    [2, 1, 2, 3, 2, 1],
    [2, 3, 2, 1, 2, 1],
    [1, 1, 1, 3, 2, 3],
    [1, 3, 1, 1, 2, 3],
    [1, 3, 1, 3, 2, 1],
    [1, 1, 2, 3, 1, 3],
    [1, 3, 2, 1, 1, 3],
    [1, 3, 2, 3, 1, 1],
    [2, 1, 1, 3, 1, 3],
    [2, 3, 1, 1, 1, 3],
    [2, 3, 1, 3, 1, 1],
    [1, 1, 2, 1, 3, 3],
    [1, 1, 2, 3, 3, 1],
    [1, 3, 2, 1, 3, 1],
    [1, 1, 3, 1, 2, 3],
    [1, 1, 3, 3, 2, 1],
    [1, 3, 3, 1, 2, 1],
    [3, 1, 3, 1, 2, 1],
    [2, 1, 1, 3, 3, 1],
    [2, 3, 1, 1, 3, 1],
    [2, 1, 3, 1, 1, 3],
    [2, 1, 3, 3, 1, 1],
    [2, 1, 3, 1, 3, 1],
    [3, 1, 1, 1, 2, 3],
    [3, 1, 1, 3, 2, 1],
    [3, 3, 1, 1, 2, 1],
    [3, 1, 2, 1, 1, 3],
    [3, 1, 2, 3, 1, 1],
    [3, 3, 2, 1, 1, 1],
    [3, 1, 4, 1, 1, 1],
    [2, 2, 1, 4, 1, 1],
    [4, 3, 1, 1, 1, 1],
    [1, 1, 1, 2, 2, 4],
    [1, 1, 1, 4, 2, 2],
    [1, 2, 1, 1, 2, 4],
    [1, 2, 1, 4, 2, 1],
    [1, 4, 1, 1, 2, 2],
    [1, 4, 1, 2, 2, 1],
    [1, 1, 2, 2, 1, 4],
    [1, 1, 2, 4, 1, 2],
    [1, 2, 2, 1, 1, 4],
    [1, 2, 2, 4, 1, 1],
    [1, 4, 2, 1, 1, 2],
    [1, 4, 2, 2, 1, 1],
    [2, 4, 1, 2, 1, 1],
    [2, 2, 1, 1, 1, 4],
    [4, 1, 3, 1, 1, 1],
    [2, 4, 1, 1, 1, 2],
    [1, 3, 4, 1, 1, 1],
    [1, 1, 1, 2, 4, 2],
    [1, 2, 1, 1, 4, 2],
    [1, 2, 1, 2, 4, 1],
    [1, 1, 4, 2, 1, 2],
    [1, 2, 4, 1, 1, 2],
    [1, 2, 4, 2, 1, 1],
    [4, 1, 1, 2, 1, 2],
    [4, 2, 1, 1, 1, 2],
    [4, 2, 1, 2, 1, 1],
    [2, 1, 2, 1, 4, 1],
    [2, 1, 4, 1, 2, 1],
    [4, 1, 2, 1, 2, 1],
    [1, 1, 1, 1, 4, 3],
    [1, 1, 1, 3, 4, 1],
    [1, 3, 1, 1, 4, 1],
    [1, 1, 4, 1, 1, 3],
    [1, 1, 4, 3, 1, 1],
    [4, 1, 1, 1, 1, 3],
    [4, 1, 1, 3, 1, 1],
    [1, 1, 3, 1, 4, 1],
    [1, 1, 4, 1, 3, 1],
    [3, 1, 1, 1, 4, 1],
    [4, 1, 1, 1, 3, 1],
    [2, 1, 1, 4, 1, 2], // 100-103 (103 = Start A)
    [2, 1, 1, 2, 1, 4],
    [2, 1, 1, 2, 4, 1],
    [2, 3, 3, 1, 1, 1], // 104 = Start B, 105 = Start C, 106 = Stop (partial)
];
// Stop pattern for Code 128 is special: 2 3 3 1 1 1 2 (13 modules)
const C128_STOP = [2, 3, 3, 1, 1, 1, 2];

// ─── EAN/UPC ─────────────────────────────────────────────────────────────────
// L-code: odd parity (used left side, digit 0 encoding)
const EAN_L = [
    '0001101',
    '0011001',
    '0010011',
    '0111101',
    '0100011',
    '0110001',
    '0101111',
    '0111011',
    '0110111',
    '0001011',
];
// G-code: even parity (used left side for EAN-13 structure)
const EAN_G = [
    '0100111',
    '0110011',
    '0011011',
    '0100001',
    '0011101',
    '0111001',
    '0000101',
    '0010001',
    '0001001',
    '0010111',
];
// R-code: right side
const EAN_R = [
    '1110010',
    '1100110',
    '1101100',
    '1000010',
    '1011100',
    '1001110',
    '1010000',
    '1000100',
    '1001000',
    '1110100',
];

// First digit parity structure for EAN-13 (L=false, G=true)
const EAN13_PARITY = [
    [false, false, false, false, false, false], // 0
    [false, false, true, false, true, true], // 1
    [false, false, true, true, false, true], // 2
    [false, false, true, true, true, false], // 3
    [false, true, false, false, true, true], // 4
    [false, true, true, false, false, true], // 5
    [false, true, true, true, false, false], // 6
    [false, true, false, true, false, true], // 7
    [false, true, false, true, true, false], // 8
    [false, true, true, false, true, false], // 9
];

function eanCheckDigit(digits: number[]): number {
    // weights: odd positions × 1, even positions × 3 (1-indexed from left)
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        sum += digits[i]! * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
}

// ─── Code 39 ─────────────────────────────────────────────────────────────────
// Each char: 9 elements (5 bars, 4 spaces), narrow=1 module, wide=3 modules
// 1=narrow, 3=wide (alternating bar/space starting with bar)
const C39_CHARS: Record<string, number[]> = {
    '0': [1, 1, 1, 3, 3, 1, 3, 1, 1],
    '1': [3, 1, 1, 3, 1, 1, 1, 1, 3],
    '2': [1, 1, 3, 3, 1, 1, 1, 1, 3],
    '3': [3, 1, 3, 3, 1, 1, 1, 1, 1],
    '4': [1, 1, 1, 3, 3, 1, 1, 1, 3],
    '5': [3, 1, 1, 3, 3, 1, 1, 1, 1],
    '6': [1, 1, 3, 3, 3, 1, 1, 1, 1],
    '7': [1, 1, 1, 3, 1, 1, 3, 1, 3],
    '8': [3, 1, 1, 3, 1, 1, 3, 1, 1],
    '9': [1, 1, 3, 3, 1, 1, 3, 1, 1],
    A: [3, 1, 1, 1, 1, 3, 1, 1, 3],
    B: [1, 1, 3, 1, 1, 3, 1, 1, 3],
    C: [3, 1, 3, 1, 1, 3, 1, 1, 1],
    D: [1, 1, 1, 1, 3, 3, 1, 1, 3],
    E: [3, 1, 1, 1, 3, 3, 1, 1, 1],
    F: [1, 1, 3, 1, 3, 3, 1, 1, 1],
    G: [1, 1, 1, 1, 1, 3, 3, 1, 3],
    H: [3, 1, 1, 1, 1, 3, 3, 1, 1],
    I: [1, 1, 3, 1, 1, 3, 3, 1, 1],
    J: [1, 1, 1, 1, 3, 3, 3, 1, 1],
    K: [3, 1, 1, 1, 1, 1, 1, 3, 3],
    L: [1, 1, 3, 1, 1, 1, 1, 3, 3],
    M: [3, 1, 3, 1, 1, 1, 1, 3, 1],
    N: [1, 1, 1, 1, 3, 1, 1, 3, 3],
    O: [3, 1, 1, 1, 3, 1, 1, 3, 1],
    P: [1, 1, 3, 1, 3, 1, 1, 3, 1],
    Q: [1, 1, 1, 1, 1, 1, 3, 3, 3],
    R: [3, 1, 1, 1, 1, 1, 3, 3, 1],
    S: [1, 1, 3, 1, 1, 1, 3, 3, 1],
    T: [1, 1, 1, 1, 3, 1, 3, 3, 1],
    U: [3, 3, 1, 1, 1, 1, 1, 1, 3],
    V: [1, 3, 3, 1, 1, 1, 1, 1, 3],
    W: [3, 3, 3, 1, 1, 1, 1, 1, 1],
    X: [1, 3, 1, 1, 3, 1, 1, 1, 3],
    Y: [3, 3, 1, 1, 3, 1, 1, 1, 1],
    Z: [1, 3, 3, 1, 3, 1, 1, 1, 1],
    '-': [1, 3, 1, 1, 1, 1, 3, 1, 3],
    '.': [3, 3, 1, 1, 1, 1, 3, 1, 1],
    ' ': [1, 3, 3, 1, 1, 1, 3, 1, 1],
    $: [1, 3, 1, 3, 1, 3, 1, 1, 1],
    '/': [1, 3, 1, 3, 1, 1, 1, 3, 1],
    '+': [1, 3, 1, 1, 1, 3, 1, 3, 1],
    '%': [1, 1, 1, 3, 1, 3, 1, 3, 1],
    '*': [1, 3, 1, 1, 3, 1, 3, 1, 1], // * = start/stop
};

// ─── Rendering ───────────────────────────────────────────────────────────────
function renderSvg(modules: number[], barWidth: number, height: number, color: string, bg: string): string {
    const totalWidth = modules.reduce((a, b) => a + b, 0) * barWidth;
    const rects: string[] = [`<rect width="${totalWidth}" height="${height}" fill="${bg}" />`];
    let x = 0;
    let isBar = true;
    for (const w of modules) {
        const px = w * barWidth;
        if (isBar) {
            rects.push(`<rect x="${x}" y="0" width="${px}" height="${height}" fill="${color}" />`);
        }
        x += px;
        isBar = !isBar;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">${rects.join('')}</svg>`;
}

function renderPng(modules: number[], barWidth: number, height: number, color: string, bg: string): Buffer {
    const totalWidth = modules.reduce((a, b) => a + b, 0) * barWidth;
    const canvas = createCanvas(totalWidth, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, totalWidth, height);
    ctx.fillStyle = color;
    let x = 0;
    let isBar = true;
    for (const w of modules) {
        const px = w * barWidth;
        if (isBar) ctx.fillRect(x, 0, px, height);
        x += px;
        isBar = !isBar;
    }
    return canvas.toBuffer('image/png');
}

// ─── Encoders ─────────────────────────────────────────────────────────────────
function encodeCode128(data: string): number[] {
    for (const ch of data) {
        const code = ch.charCodeAt(0);
        if (code < 32 || code > 126) {
            throw new Error(`Code 128 only supports ASCII 32-126 (invalid char: "${ch}")`);
        }
    }
    const START_B = 104;

    const charValues = [...data].map((ch) => ch.charCodeAt(0) - 32);
    let checksum = START_B;
    for (let i = 0; i < charValues.length; i++) {
        checksum += (i + 1) * charValues[i]!;
    }
    checksum %= 103;

    const patterns = [C128_PATTERNS[START_B]!, ...charValues.map((v) => C128_PATTERNS[v]!), C128_PATTERNS[checksum]!];

    // Flatten all 6-width patterns + stop pattern
    const modules: number[] = [];
    for (const pat of patterns) {
        for (const w of pat) modules.push(w);
    }
    // Stop bar
    for (const w of C128_STOP) modules.push(w);

    // Quiet zone: 10 modules on each side (represented as extra space in first/last)
    return [10, ...modules, 10];
}

function bitsToModules(bits: string): number[] {
    const modules: number[] = [];
    let i = 0;
    while (i < bits.length) {
        let count = 1;
        while (i + count < bits.length && bits[i + count] === bits[i]) count++;
        modules.push(count);
        i += count;
    }
    return modules;
}

function encodeEan13(data: string): number[] {
    const digits = data.replace(/\D/g, '');
    if (digits.length !== 12 && digits.length !== 13) {
        throw new Error('EAN-13 requires 12 or 13 digits');
    }
    const d = digits.split('').map(Number);
    let nums: number[];

    if (d.length === 13) {
        const expected = eanCheckDigit(d.slice(0, 12));
        if (d[12] !== expected) {
            throw new Error(`Invalid EAN-13 check digit (expected ${expected}, got ${d[12]})`);
        }
        nums = d;
    } else {
        nums = [...d, eanCheckDigit(d)];
    }

    const first = nums[0]!;
    const parity = EAN13_PARITY[first]!;

    let bits = '101'; // left guard
    for (let i = 0; i < 6; i++) {
        bits += parity[i] ? EAN_G[nums[i + 1]!]! : EAN_L[nums[i + 1]!]!;
    }
    bits += '01010'; // center guard
    for (let i = 7; i <= 12; i++) {
        bits += EAN_R[nums[i]!]!;
    }
    bits += '101'; // right guard

    return [7, ...bitsToModules(bits), 7]; // quiet zones
}

function encodeEan8(data: string): number[] {
    const digits = data.replace(/\D/g, '');
    if (digits.length !== 7 && digits.length !== 8) {
        throw new Error('EAN-8 requires 7 or 8 digits');
    }
    const d = digits.split('').map(Number);
    let nums: number[];

    if (d.length === 8) {
        const expected = eanCheckDigit(d.slice(0, 7));
        if (d[7] !== expected) {
            throw new Error(`Invalid EAN-8 check digit (expected ${expected}, got ${d[7]})`);
        }
        nums = d;
    } else {
        nums = [...d, eanCheckDigit(d)];
    }

    let bits = '101'; // left guard
    for (let i = 0; i < 4; i++) bits += EAN_L[nums[i]!]!;
    bits += '01010'; // center guard
    for (let i = 4; i < 8; i++) bits += EAN_R[nums[i]!]!;
    bits += '101'; // right guard

    return [7, ...bitsToModules(bits), 7];
}

function encodeUpca(data: string): number[] {
    const digits = data.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 12) {
        throw new Error('UPC-A requires 11 or 12 digits');
    }
    return encodeEan13(digits.length === 11 ? `0${digits}` : `0${digits.slice(0, 11)}${digits[11]}`);
}

function encodeCode39(data: string): number[] {
    const upper = data.toUpperCase();
    for (const ch of upper) {
        if (!C39_CHARS[ch]) {
            throw new Error(`Code 39 invalid character: "${ch}". Allowed: A-Z, 0-9, space, - . $ / + %`);
        }
    }

    const NARROW = 1;
    const GAP = NARROW; // inter-character gap (narrow space)
    const modules: number[] = [NARROW * 10]; // quiet zone

    const encode = (ch: string) => C39_CHARS[ch]!;
    const chars = ['*', ...upper, '*'];

    for (let i = 0; i < chars.length; i++) {
        const pat = encode(chars[i]!);
        for (const w of pat) modules.push(w);
        if (i < chars.length - 1) modules.push(GAP); // inter-char gap
    }

    modules.push(NARROW * 10); // quiet zone
    return modules;
}

/**
 * Generates a barcode image in SVG or PNG format.
 *
 * @param options.data - Data to encode (required)
 * @param options.type - Barcode type: code128, ean13, ean8, upca, code39 (default: code128)
 * @param options.width - Bar unit width in px (1–5, default 2)
 * @param options.height - Bar height in px (50–300, default 100)
 * @param options.format - Output format: svg or png (default: svg)
 * @param options.color - Bar color hex (default: #000000)
 * @param options.bg - Background color hex (default: #ffffff)
 * @returns Object with contentType and body
 * @throws Error if data is missing, invalid for the type, or parameters are out of range
 */
export default function barcode(options: BarcodeOptions): BarcodeResult {
    if (!options.data) throw new Error('Please provide data to encode (?data={string})');

    const type = (options.type ?? 'code128') as BarcodeType;
    const format = (options.format ?? 'svg') as BarcodeFormat;
    const barWidth = clamp(options.width ?? 2, 1, 5);
    const height = clamp(options.height ?? 100, 50, 300);
    const color = normalizeColor(options.color, '#000000');
    const bg = normalizeColor(options.bg, '#ffffff');

    if (!VALID_TYPES.includes(type)) {
        throw new Error(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (!VALID_FORMATS.includes(format)) {
        throw new Error(`Format must be one of: ${VALID_FORMATS.join(', ')}`);
    }
    if (options.width !== undefined && (options.width < 1 || options.width > 5)) {
        throw new Error('Width must be between 1 and 5');
    }
    if (options.height !== undefined && (options.height < 50 || options.height > 300)) {
        throw new Error('Height must be between 50 and 300');
    }

    const encoders: Record<BarcodeType, (d: string) => number[]> = {
        code128: encodeCode128,
        ean13: encodeEan13,
        ean8: encodeEan8,
        upca: encodeUpca,
        code39: encodeCode39,
    };

    const modules = encoders[type](options.data);
    const contentType = format === 'png' ? 'image/png' : 'image/svg+xml';
    const body =
        format === 'png'
            ? renderPng(modules, barWidth, height, color, bg)
            : renderSvg(modules, barWidth, height, color, bg);

    return { contentType, body };
}
