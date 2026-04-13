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

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error('Invalid HEX color (use #RRGGBB)');
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

function format(r: number, g: number, b: number): PaletteColor {
    const [h, s, l] = rgbToHsl(r, g, b);
    return {
        hex: `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`,
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
