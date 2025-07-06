/**
 * Generate a random color in multiple formats
 *
 * @returns {Object} Color in various formats (hex, rgb, hsl, hsv, hwb, cmyk)
 */
export default function color() {
    const r = Math.floor(Math.random() * 256), g = Math.floor(Math.random() * 256), b = Math.floor(Math.random() * 256);

    const hsl = (() => {
        const r1 = r / 255, g1 = g / 255, b1 = b / 255, max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1), l = (max + min) / 2;
        if (max === min) return [0, 0, l * 100];
        const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h = { [r1]: (g1 - b1) / d + (g1 < b1 ? 6 : 0), [g1]: (b1 - r1) / d + 2, [b1]: (r1 - g1) / d + 4 }[max];
        return [h * 60 % 360, s * 100, l * 100];
    })();

    const hsv = (() => {
        const max = Math.max(r, g, b), min = Math.min(r, g, b), v = max / 255, s = max ? (max - min) / max : 0;
        let h = max === min ? 0 : { [r]: (g - b) / (max - min), [g]: 2 + (b - r) / (max - min), [b]: 4 + (r - g) / (max - min) }[max];
        return [h * 60 % 360, s * 100, v * 100];
    })();

    const hwb = (() => {
        const [h] = hsv, whiteness = Math.min(r, g, b) / 255, blackness = 1 - Math.max(r, g, b) / 255;
        return [h, whiteness * 100, blackness * 100];
    })();

    const cmyk = (() => {
        const k = 1 - Math.max(r, g, b) / 255, c = (1 - r / 255 - k) / (1 - k) || 0, m = (1 - g / 255 - k) / (1 - k) || 0, y = (1 - b / 255 - k) / (1 - k) || 0;
        return [c, m, y, k].map(x => x * 100);
    })();

    return {
        hex: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${hsl[0].toFixed(1)}, ${hsl[1].toFixed(1)}%, ${hsl[2].toFixed(1)}%)`,
        hsv: `hsv(${hsv[0].toFixed(1)}, ${hsv[1].toFixed(1)}%, ${hsv[2].toFixed(1)}%)`,
        hwb: `hwb(${hwb[0].toFixed(1)}, ${hwb[1].toFixed(1)}%, ${hwb[2].toFixed(1)}%)`,
        cmyk: `cmyk(${cmyk.map(x => x.toFixed(1)).join('%, ')}%)`
    };
}