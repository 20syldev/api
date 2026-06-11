import { MAX_URL_LENGTH } from '../../constants.js';

export interface UrlResult {
    url: string;
    scheme: string;
    host: string;
    port: number | null;
    path: string;
    params: Record<string, string>;
    fragment: string;
    valid: boolean;
}

/**
 * Parses a URL into its structural components.
 */
export default function parseUrl(url: string): UrlResult {
    if (!url) throw new Error('Please provide a URL (?url={URL})');
    if (url.length > MAX_URL_LENGTH) throw new Error(`URL cannot exceed ${MAX_URL_LENGTH} characters`);

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL');
    }

    return {
        url,
        scheme: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : null,
        path: parsed.pathname,
        params: Object.fromEntries(parsed.searchParams),
        fragment: parsed.hash.replace('#', ''),
        valid: true,
    };
}
