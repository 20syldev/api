import { hexToRgb, rgbToHsl, rgbToHex } from '../../utils/colors.js';

export interface ColorResult {
    hex: string;
    rgb: string;
    hsl: string;
    hsv: string;
    hwb: string;
    cmyk: string;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        v = max / 255,
        s = max ? (max - min) / max : 0;

    if (max === min) return [0, s * 100, v * 100];

    let h = 0;
    const d = max - min;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;

    return [(h * 60) % 360, s * 100, v * 100];
}

function rgbToHwb(r: number, g: number, b: number): [number, number, number] {
    const [h] = rgbToHsv(r, g, b);
    const whiteness = Math.min(r, g, b) / 255;
    const blackness = 1 - Math.max(r, g, b) / 255;
    return [h, whiteness * 100, blackness * 100];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
    const k = 1 - Math.max(r, g, b) / 255;
    const c = (1 - r / 255 - k) / (1 - k) || 0;
    const m = (1 - g / 255 - k) / (1 - k) || 0;
    const y = (1 - b / 255 - k) / (1 - k) || 0;
    return [c * 100, m * 100, y * 100, k * 100];
}

/**
 * Converts a hex color to all major color space representations, or generates a random color.
 *
 * @param hex - Optional hex color string (e.g. "#ff5733"); generates a random color if omitted
 * @returns Color in hex, RGB, HSL, HSV, HWB, and CMYK formats
 * @throws Error if the hex string is invalid
 */
export default function color(hex?: string): ColorResult {
    let r: number, g: number, b: number;

    if (hex) {
        [r, g, b] = hexToRgb(hex);
    } else {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
    }

    const [h, s, l] = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);
    const hwb = rgbToHwb(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    return {
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`,
        hsv: `hsv(${hsv[0].toFixed(1)}, ${hsv[1].toFixed(1)}%, ${hsv[2].toFixed(1)}%)`,
        hwb: `hwb(${hwb[0].toFixed(1)}, ${hwb[1].toFixed(1)}%, ${hwb[2].toFixed(1)}%)`,
        cmyk: `cmyk(${cmyk.map((x) => x.toFixed(1)).join('%, ')}%)`,
    };
}
