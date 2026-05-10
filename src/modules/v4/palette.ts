import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../../utils/colors.js';

export interface PaletteColor {
    hex: string;
    rgb: string;
    hsl: string;
}

export interface PaletteResult {
    base: PaletteColor;
    type: string;
    colors: PaletteColor[];
}

function format(r: number, g: number, b: number): PaletteColor {
    const [h, s, l] = rgbToHsl(r, g, b);
    return {
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`,
    };
}

function fromHueShifts(base: [number, number, number], shifts: number[]): PaletteColor[] {
    const [h, s, l] = base;
    return shifts.map((shift) => {
        const newH = (h + shift + 360) % 360;
        const [r, g, b] = hslToRgb(newH, s, l);
        return format(r, g, b);
    });
}

/**
 * Generates a color palette from a base hex color using a specified harmony type.
 *
 * @param color - Base hex color (e.g. "#ff5733")
 * @param type - Palette type: "complementary", "triadic", "analogous", "tetradic", or "split-complementary"
 * @returns Object containing the base color and the derived palette colors in hex, RGB, and HSL
 * @throws Error if color or type is missing, or the type is not one of the accepted values
 */
export default function palette(color: string, type: string): PaletteResult {
    if (!color) throw new Error('A base color is required');
    if (!type) throw new Error('A palette type is required');

    const [r, g, b] = hexToRgb(color);
    const base = format(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    let colors: PaletteColor[];
    switch (type) {
        case 'complementary':
            colors = fromHueShifts(hsl, [0, 180]);
            break;
        case 'triadic':
            colors = fromHueShifts(hsl, [0, 120, 240]);
            break;
        case 'analogous':
            colors = fromHueShifts(hsl, [-60, -30, 0, 30, 60]);
            break;
        case 'tetradic':
            colors = fromHueShifts(hsl, [0, 90, 180, 270]);
            break;
        case 'split-complementary':
            colors = fromHueShifts(hsl, [0, 150, 210]);
            break;
        default:
            throw new Error('Type must be one of: complementary, triadic, analogous, tetradic, split-complementary');
    }

    return { base, type, colors };
}
