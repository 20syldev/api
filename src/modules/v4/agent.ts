import { MAX_STRING_LENGTH } from '../../constants.js';

export interface UserAgentResult {
    raw: string;
    browser: { name: string; version: string; major: string };
    os: { name: string; version: string };
    device: { type: 'mobile' | 'tablet' | 'desktop'; vendor: string };
    engine: { name: string; version: string };
    bot: boolean;
}

const WINDOWS_MAP: Record<string, string> = {
    '10.0': 'Windows 10/11',
    '6.3': 'Windows 8.1',
    '6.2': 'Windows 8',
    '6.1': 'Windows 7',
    '6.0': 'Windows Vista',
    '5.1': 'Windows XP',
};

/**
 * Parses a User-Agent string and extracts browser, OS, device, engine
 * and bot information.
 *
 * @param ua - The User-Agent string to parse
 * @returns Structured breakdown of the User-Agent
 * @throws Error if the User-Agent string is missing or too long
 */
export default function agent(ua: string): UserAgentResult {
    if (!ua || typeof ua !== 'string') throw new Error('A User-Agent string is required');
    if (ua.length > MAX_STRING_LENGTH) throw new Error(`User-Agent must be less than ${MAX_STRING_LENGTH} characters`);

    const unknown = { name: 'unknown', version: 'unknown', major: 'unknown' };

    const bot = /bot|crawl|spider|lighthouse|headless|prerender|slurp|bingpreview/i.test(ua);

    // Browser — order matters: Edge/Opera before Chrome
    let browser = { ...unknown };
    const browserRules: [RegExp, string][] = [
        [/Edg\/(\d+[\d.]*)/i, 'Edge'],
        [/OPR\/(\d+[\d.]*)/i, 'Opera'],
        [/SamsungBrowser\/(\d+[\d.]*)/i, 'Samsung Internet'],
        [/Chrome\/(\d+[\d.]*)/i, 'Chrome'],
        [/Firefox\/(\d+[\d.]*)/i, 'Firefox'],
        [/Version\/([\d.]+).*Safari/i, 'Safari'],
        [/MSIE ([\d.]+)/i, 'Internet Explorer'],
        [/Trident\/.*rv:([\d.]+)/i, 'Internet Explorer'],
    ];
    for (const [re, name] of browserRules) {
        const m = ua.match(re);
        if (m) {
            browser = { name, version: m[1]!, major: m[1]!.split('.')[0]! };
            break;
        }
    }

    // OS
    let os = { name: 'unknown', version: 'unknown' };
    const osRules: [RegExp, (m: RegExpMatchArray) => typeof os][] = [
        [/iPhone OS ([\d_]+)/i, (m) => ({ name: 'iOS', version: m[1]!.replace(/_/g, '.') })],
        [/iPad.*OS ([\d_]+)/i, (m) => ({ name: 'iPadOS', version: m[1]!.replace(/_/g, '.') })],
        [/Android ([\d.]+)/i, (m) => ({ name: 'Android', version: m[1]! })],
        [/Windows NT ([\d.]+)/i, (m) => ({ name: WINDOWS_MAP[m[1]!] ?? 'Windows', version: m[1]! })],
        [/Mac OS X ([\d_.]+)/i, (m) => ({ name: 'macOS', version: m[1]!.replace(/_/g, '.') })],
        [/Linux/i, () => ({ name: 'Linux', version: 'unknown' })],
    ];
    for (const [re, build] of osRules) {
        const m = ua.match(re);
        if (m) {
            os = build(m);
            break;
        }
    }

    // Device
    const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua) && !/iPad/i.test(ua);
    const isTablet = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const deviceType: 'mobile' | 'tablet' | 'desktop' = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    let vendor = 'unknown';
    if (/iPhone|iPad|Macintosh/i.test(ua)) vendor = 'Apple';
    else if (/Samsung/i.test(ua)) vendor = 'Samsung';
    else if (/Pixel|Nexus/i.test(ua)) vendor = 'Google';
    else if (/Huawei/i.test(ua)) vendor = 'Huawei';

    // Engine
    let engine = { name: 'unknown', version: 'unknown' };
    const engineRules: [RegExp, string][] = [
        [/AppleWebKit\/([\d.]+)/i, 'WebKit'],
        [/Gecko\/([\d.]+)/i, 'Gecko'],
        [/Trident\/([\d.]+)/i, 'Trident'],
    ];
    for (const [re, name] of engineRules) {
        const m = ua.match(re);
        if (m) {
            // Chrome and Edge use Blink, a WebKit fork
            const engineName = name === 'WebKit' && /Chrome|Edg/i.test(ua) ? 'Blink' : name;
            engine = { name: engineName, version: m[1]! };
            break;
        }
    }

    return { raw: ua, browser, os, device: { type: deviceType, vendor }, engine, bot };
}
