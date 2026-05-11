export interface GeoResult {
    distance: { km: number; miles: number; nauticalMiles: number };
    bearing: { degrees: number; cardinal: string };
    from: { lat: number; lon: number };
    to: { lat: number; lon: number };
}

import { EARTH_RADIUS_KM } from '../../constants.js';

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

function parseCoord(value: string, name: string, min: number, max: number): number {
    const n = Number(value);
    if (isNaN(n)) throw new Error(`${name} must be a number`);
    if (n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}`);
    return n;
}

/**
 * Calculates the great-circle distance and bearing between two geographic coordinates.
 *
 * @param lat1 - Latitude of the first point (-90 to 90)
 * @param lon1 - Longitude of the first point (-180 to 180)
 * @param lat2 - Latitude of the second point (-90 to 90)
 * @param lon2 - Longitude of the second point (-180 to 180)
 * @returns Distance in km/miles/nautical miles, compass bearing, and both coordinates
 * @throws Error if any coordinate is out of range or not a number
 */
export default function geo(lat1: string, lon1: string, lat2: string, lon2: string): GeoResult {
    const a = parseCoord(lat1, 'lat1', -90, 90);
    const b = parseCoord(lon1, 'lon1', -180, 180);
    const c = parseCoord(lat2, 'lat2', -90, 90);
    const d = parseCoord(lon2, 'lon2', -180, 180);

    const dLat = toRad(c - a);
    const dLon = toRad(d - b);
    const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
    const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(sa));

    const y = Math.sin(toRad(d - b)) * Math.cos(toRad(c));
    const x =
        Math.cos(toRad(a)) * Math.sin(toRad(c)) - Math.sin(toRad(a)) * Math.cos(toRad(c)) * Math.cos(toRad(d - b));
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    const cardinal = CARDINALS[Math.round(bearing / 22.5) % 16]!;

    return {
        distance: {
            km: +distance.toFixed(3),
            miles: +(distance * 0.621371).toFixed(3),
            nauticalMiles: +(distance * 0.539957).toFixed(3),
        },
        bearing: { degrees: +bearing.toFixed(2), cardinal },
        from: { lat: a, lon: b },
        to: { lat: c, lon: d },
    };
}
