export default function convert(value, from, to) {
    const conversions = {
        celsius: {
            fahrenheit: (val) => (val * 9) / 5 + 32,
            kelvin: (val) => val + 273.15
        },
        fahrenheit: {
            celsius: (val) => ((val - 32) * 5) / 9,
            kelvin: (val) => ((val - 32) * 5) / 9 + 273.15
        },
        kelvin: {
            celsius: (val) => val - 273.15,
            fahrenheit: (val) => ((val - 273.15) * 9) / 5 + 32
        },
    };

    const convert = conversions[from.toLowerCase()]?.[to.toLowerCase()];

    if (!convert) return { error: 'Invalid conversion unit' };
    if (isNaN(value)) return { error: 'Value must be a number' };
    if (value < -273.15) return { error: 'Value must be greater than absolute zero' };
    if (value > 1e6) return { error: 'Value must be less than 1,000,000' };

    return {
        from,
        to,
        value: parseFloat(value),
        result: convert(parseFloat(value))
    };
}