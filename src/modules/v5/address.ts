import v4address, { type AddressResult } from '../v4/address.js';

const NAME_THEN_TYPE = new Set(['US', 'UK', 'DE']);

/**
 * Generates one or more fictional postal addresses.
 */
export default function address(countryCode?: string, count: number = 1): AddressResult {
    const result = v4address(countryCode, count);

    return {
        addresses: result.addresses.map((a) => {
            if (!NAME_THEN_TYPE.has(a.countryCode)) return a;
            const parts = a.street.split(' ');
            if (parts.length < 3) return a;
            const [num, type, ...nameParts] = parts;
            return { ...a, street: `${num} ${nameParts.join(' ')} ${type}` };
        }),
    };
}
