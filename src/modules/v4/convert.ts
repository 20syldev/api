import { MIN_TEMPERATURE, MAX_TEMPERATURE } from '../../constants.js';

type ConversionFn = (val: number) => number;

const conversions: Record<string, Record<string, ConversionFn>> = {
    celsius: {
        fahrenheit: (val) => (val * 9) / 5 + 32,
        kelvin: (val) => val + 273.15,
    },
    fahrenheit: {
        celsius: (val) => ((val - 32) * 5) / 9,
        kelvin: (val) => ((val - 32) * 5) / 9 + 273.15,
    },
    kelvin: {
        celsius: (val) => val - 273.15,
        fahrenheit: (val) => ((val - 273.15) * 9) / 5 + 32,
    },
};

export default function convert(
    value: string | number,
    from: string,
    to: string,
): { from: string; to: string; value: number; result: number } {
    const convertFn = conversions[from.toLowerCase()]?.[to.toLowerCase()];

    if (!convertFn) throw new Error('Invalid conversion unit');
    if (isNaN(Number(value))) throw new Error('Value must be a number');
    if (Number(value) < MIN_TEMPERATURE) throw new Error('Value must be greater than absolute zero');
    if (Number(value) > MAX_TEMPERATURE) throw new Error('Value must be less than 1,000,000');

    return {
        from,
        to,
        value: parseFloat(String(value)),
        result: convertFn(parseFloat(String(value))),
    };
}
