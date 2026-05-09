import { MAX_STRING_LENGTH } from '../../constants.js';

export interface IpResult {
    ip: string;
    version: 'IPv4' | 'IPv6';
    type: 'public' | 'private' | 'loopback' | 'link-local' | 'multicast' | 'broadcast';
    class?: 'A' | 'B' | 'C' | 'D' | 'E';
    range?: string;
    binary: string;
    decimal?: number;
    reverse: string;
}

/**
 * Parses and analyzes an IPv4 address.
 *
 * @param raw - The IPv4 address string (e.g. "192.168.1.1")
 * @returns Detailed information about the address
 * @throws Error if the address is malformed
 */
function parseIPv4(raw: string): IpResult {
    const parts = raw.split('.');
    if (parts.length !== 4) throw new Error('Invalid IPv4 address');
    const octets = parts.map(Number);
    if (octets.some((o) => isNaN(o) || !Number.isInteger(o) || o < 0 || o > 255))
        throw new Error('Invalid IPv4 address');

    const [a, b, c, d] = octets as [number, number, number, number];

    let cls: 'A' | 'B' | 'C' | 'D' | 'E';
    if (a < 128) cls = 'A';
    else if (a < 192) cls = 'B';
    else if (a < 224) cls = 'C';
    else if (a < 240) cls = 'D';
    else cls = 'E';

    let type: IpResult['type'] = 'public';
    let range: string | undefined;

    if (a === 127) {
        type = 'loopback';
        range = '127.0.0.0/8';
    } else if (a === 10) {
        type = 'private';
        range = '10.0.0.0/8';
    } else if (a === 172 && b >= 16 && b <= 31) {
        type = 'private';
        range = '172.16.0.0/12';
    } else if (a === 192 && b === 168) {
        type = 'private';
        range = '192.168.0.0/16';
    } else if (a === 169 && b === 254) {
        type = 'link-local';
        range = '169.254.0.0/16';
    } else if (a >= 224 && a <= 239) {
        type = 'multicast';
        range = '224.0.0.0/4';
    } else if (raw === '255.255.255.255') {
        type = 'broadcast';
    }

    const binary = octets.map((o) => o.toString(2).padStart(8, '0')).join('.');
    const decimal = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
    const reverse = [...octets].reverse().join('.') + '.in-addr.arpa';

    const result: IpResult = { ip: raw, version: 'IPv4', type, class: cls, binary, decimal, reverse };
    if (range) result.range = range;
    return result;
}

/**
 * Parses and analyzes an IPv6 address, expanding :: shorthand.
 *
 * @param raw - The IPv6 address string (e.g. "::1" or "fe80::1")
 * @returns Detailed information about the address
 * @throws Error if the address is malformed
 */
function parseIPv6(raw: string): IpResult {
    let expanded = raw;
    if (raw.includes('::')) {
        const halves = raw.split('::');
        const left = halves[0] ? halves[0].split(':') : [];
        const right = halves[1] ? halves[1].split(':') : [];
        const fill = Array(8 - left.length - right.length).fill('0');
        expanded = [...left, ...fill, ...right].join(':');
    }

    const groups = expanded.split(':');
    if (groups.length !== 8) throw new Error('Invalid IPv6 address');
    const values = groups.map((g) => parseInt(g || '0', 16));
    if (values.some((v) => isNaN(v) || v < 0 || v > 0xffff)) throw new Error('Invalid IPv6 address');

    let type: IpResult['type'] = 'public';
    let range: string | undefined;

    if (raw === '::1' || values.every((v, i) => (i < 7 ? v === 0 : v === 1))) {
        type = 'loopback';
        range = '::1/128';
    } else if ((values[0]! & 0xfe00) === 0xfc00) {
        type = 'private';
        range = 'fc00::/7';
    } else if ((values[0]! & 0xffc0) === 0xfe80) {
        type = 'link-local';
        range = 'fe80::/10';
    } else if ((values[0]! & 0xff00) === 0xff00) {
        type = 'multicast';
        range = 'ff00::/8';
    }

    const binary = values.map((v) => v.toString(2).padStart(16, '0')).join(':');
    const hex = values.map((v) => v.toString(16).padStart(4, '0')).join('');
    const reverse = hex.split('').reverse().join('.') + '.ip6.arpa';

    const result: IpResult = { ip: expanded, version: 'IPv6', type, binary, reverse };
    if (range) result.range = range;
    return result;
}

/**
 * Analyzes an IPv4 or IPv6 address and returns its type, class, binary
 * representation, decimal value, and reverse DNS notation.
 *
 * @param address - The IP address to analyze
 * @returns Detailed breakdown of the address
 * @throws Error if the address is missing or invalid
 */
export default function ip(address: string): IpResult {
    if (!address || typeof address !== 'string') throw new Error('An IP address is required');
    if (address.length > MAX_STRING_LENGTH) throw new Error('Address is too long');

    if (address.includes(':')) return parseIPv6(address);
    if (address.includes('.')) return parseIPv4(address);
    throw new Error('Invalid IP address format');
}
