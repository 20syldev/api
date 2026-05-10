type ConversionFn = (val: number) => number;

const TEMPERATURE_UNITS = new Set(['celsius', 'fahrenheit', 'kelvin']);
const ABSOLUTE_ZERO: Record<string, number> = { celsius: -273.15, fahrenheit: -459.67, kelvin: 0 };

const conversions: Record<string, Record<string, ConversionFn>> = {
    // Temperature
    celsius: {
        fahrenheit: (v) => (v * 9) / 5 + 32,
        kelvin: (v) => v + 273.15,
    },
    fahrenheit: {
        celsius: (v) => ((v - 32) * 5) / 9,
        kelvin: (v) => ((v - 32) * 5) / 9 + 273.15,
    },
    kelvin: {
        celsius: (v) => v - 273.15,
        fahrenheit: (v) => ((v - 273.15) * 9) / 5 + 32,
    },

    // Length
    km: {
        mi: (v) => v * 0.621371,
        m: (v) => v * 1000,
        ft: (v) => v * 3280.84,
        cm: (v) => v * 100000,
        in: (v) => v * 39370.1,
        yd: (v) => v * 1093.61,
    },
    mi: {
        km: (v) => v * 1.60934,
        m: (v) => v * 1609.34,
        ft: (v) => v * 5280,
        cm: (v) => v * 160934,
        in: (v) => v * 63360,
        yd: (v) => v * 1760,
    },
    m: {
        km: (v) => v / 1000,
        mi: (v) => v * 0.000621371,
        ft: (v) => v * 3.28084,
        cm: (v) => v * 100,
        in: (v) => v * 39.3701,
        yd: (v) => v * 1.09361,
    },
    ft: {
        km: (v) => v * 0.0003048,
        mi: (v) => v / 5280,
        m: (v) => v * 0.3048,
        cm: (v) => v * 30.48,
        in: (v) => v * 12,
        yd: (v) => v / 3,
    },
    cm: {
        km: (v) => v / 100000,
        mi: (v) => v / 160934,
        m: (v) => v / 100,
        ft: (v) => v / 30.48,
        in: (v) => v / 2.54,
        yd: (v) => v / 91.44,
    },
    in: {
        km: (v) => v / 39370.1,
        mi: (v) => v / 63360,
        m: (v) => v * 0.0254,
        ft: (v) => v / 12,
        cm: (v) => v * 2.54,
        yd: (v) => v / 36,
    },
    yd: {
        km: (v) => v * 0.0009144,
        mi: (v) => v / 1760,
        m: (v) => v * 0.9144,
        ft: (v) => v * 3,
        cm: (v) => v * 91.44,
        in: (v) => v * 36,
    },

    // Weight
    kg: { lb: (v) => v * 2.20462, oz: (v) => v * 35.274, g: (v) => v * 1000, ton: (v) => v / 1000 },
    lb: { kg: (v) => v * 0.453592, oz: (v) => v * 16, g: (v) => v * 453.592, ton: (v) => v * 0.000453592 },
    oz: { kg: (v) => v * 0.0283495, lb: (v) => v / 16, g: (v) => v * 28.3495, ton: (v) => v * 0.0000283495 },
    g: { kg: (v) => v / 1000, lb: (v) => v * 0.00220462, oz: (v) => v * 0.035274, ton: (v) => v / 1000000 },
    ton: { kg: (v) => v * 1000, lb: (v) => v * 2204.62, oz: (v) => v * 35274, g: (v) => v * 1000000 },

    // Data
    b: { kb: (v) => v / 1024, mb: (v) => v / 1048576, gb: (v) => v / 1073741824, tb: (v) => v / 1099511627776 },
    kb: { b: (v) => v * 1024, mb: (v) => v / 1024, gb: (v) => v / 1048576, tb: (v) => v / 1073741824 },
    mb: { b: (v) => v * 1048576, kb: (v) => v * 1024, gb: (v) => v / 1024, tb: (v) => v / 1048576 },
    gb: { b: (v) => v * 1073741824, kb: (v) => v * 1048576, mb: (v) => v * 1024, tb: (v) => v / 1024 },
    tb: { b: (v) => v * 1099511627776, kb: (v) => v * 1073741824, mb: (v) => v * 1048576, gb: (v) => v * 1024 },

    // Speed
    'km/h': { mph: (v) => v * 0.621371, 'm/s': (v) => v / 3.6, knots: (v) => v * 0.539957 },
    mph: { 'km/h': (v) => v * 1.60934, 'm/s': (v) => v * 0.44704, knots: (v) => v * 0.868976 },
    'm/s': { 'km/h': (v) => v * 3.6, mph: (v) => v * 2.23694, knots: (v) => v * 1.94384 },
    knots: { 'km/h': (v) => v * 1.852, mph: (v) => v * 1.15078, 'm/s': (v) => v * 0.514444 },
};

/**
 * Converts a numeric value from one unit to another.
 *
 * @param value - The numeric value to convert
 * @param from - The source unit (e.g. "km", "celsius", "kg")
 * @param to - The target unit (e.g. "mi", "fahrenheit", "lb")
 * @returns Object with source unit, target unit, original value, and converted result
 * @throws Error if the conversion pair is unsupported, the value is NaN, or the temperature is below absolute zero
 */
export default function convert(
    value: number,
    from: string,
    to: string,
): { from: string; to: string; value: number; result: number } {
    const fromKey = from.toLowerCase();
    const toKey = to.toLowerCase();
    const convertFn = conversions[fromKey]?.[toKey];

    if (!convertFn) throw new Error('Invalid conversion unit');
    if (isNaN(value)) throw new Error('Value must be a number');

    if (TEMPERATURE_UNITS.has(fromKey)) {
        const minValue = ABSOLUTE_ZERO[fromKey]!;
        if (value < minValue) throw new Error('Value must be greater than absolute zero');
    }

    return { from, to, value, result: convertFn(value) };
}
