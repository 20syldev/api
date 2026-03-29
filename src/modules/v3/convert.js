/**
 * Converts values between different temperature units
 *
 * @param {number|string} value - The value to convert
 * @param {string} from - The source unit (celsius, fahrenheit, or kelvin)
 * @param {string} to - The target unit (celsius, fahrenheit, or kelvin)
 * @returns {Object} - Object containing the conversion details
 * @throws {Error} - If conversion parameters are invalid
 */
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

    if (!convert) throw new Error('Invalid conversion unit');
    if (isNaN(value)) throw new Error('Value must be a number');
    if (value < -273.15) throw new Error('Value must be greater than absolute zero');
    if (value > 1e6) throw new Error('Value must be less than 1,000,000');

    return {
        from,
        to,
        value: parseFloat(value),
        result: convert(parseFloat(value))
    };
}