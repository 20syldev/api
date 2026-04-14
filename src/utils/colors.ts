/**
 * Parses a hex color string into an RGB tuple.
 *
 * @param hex - Hex color string (#RRGGBB or RRGGBB)
 * @returns RGB tuple [r, g, b] with values 0-255
 * @throws Error if the hex string is invalid
 */
export function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error('Invalid HEX color (use #RRGGBB)');
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

/**
 * Converts HSL values to an RGB tuple.
 *
 * @param h - Hue in degrees (0-360)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 * @returns RGB tuple [r, g, b] with values 0-255
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0,
        g1 = 0,
        b1 = 0;
    if (h < 60) [r1, g1, b1] = [c, x, 0];
    else if (h < 120) [r1, g1, b1] = [x, c, 0];
    else if (h < 180) [r1, g1, b1] = [0, c, x];
    else if (h < 240) [r1, g1, b1] = [0, x, c];
    else if (h < 300) [r1, g1, b1] = [x, 0, c];
    else [r1, g1, b1] = [c, 0, x];
    return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

/**
 * Validates and normalizes a hex color string, adding # if missing.
 *
 * @param value - Raw color value (with or without #)
 * @param def - Default color if value is empty
 * @returns Normalized hex color string with #
 * @throws Error if the color format is invalid
 */
export function normalizeColor(value: string | undefined, def: string): string {
    if (!value) return def;
    const clean = value.startsWith('#') ? value : `#${value}`;
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(clean)) throw new Error('Invalid color (use hex like ff6600)');
    return clean;
}

/**
 * Formats an RGB tuple as a hex color string.
 *
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Hex color string (#rrggbb)
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Converts RGB values to an HSL tuple.
 *
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns HSL tuple [h (0-360), s (0-1), l (0-1)]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const r1 = r / 255,
        g1 = g / 255,
        b1 = b / 255;
    const max = Math.max(r1, g1, b1),
        min = Math.min(r1, g1, b1);
    const l = (max + min) / 2;

    if (max === min) return [0, 0, l];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r1) h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
    else if (max === g1) h = (b1 - r1) / d + 2;
    else h = (r1 - g1) / d + 4;

    return [(h * 60 + 360) % 360, s, l];
}
