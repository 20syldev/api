import * as apiv3 from '../modules/v3.js';
import * as apiv4 from '../modules/v4.js';

export interface Endpoint {
    name: string;
    path?: string;
    children?: Record<string, string>;
}

export interface VersionConfig {
    endpoints: {
        get: Endpoint[];
        post: Endpoint[];
        patch?: Endpoint[];
        delete?: Endpoint[];
    };
    modules: typeof apiv3 | typeof apiv4;
}

/**
 * Merges a base list of endpoints with additions, deduplicating by `name`.
 * If an addition has the same name as a base entry, it overrides it.
 */
const merge = (base: Endpoint[], additions: Endpoint[]): Endpoint[] => {
    const map = new Map(base.map((e) => [e.name, e]));
    for (const e of additions) map.set(e.name, e);
    return [...map.values()];
};

const v1 = {
    get: [
        { name: 'algorithms', path: '/algorithms?method={algorithm}&value={value}(&value2={value2})' },
        { name: 'captcha', path: '/captcha?text={text}' },
        { name: 'color', path: '/color' },
        { name: 'convert', path: '/convert?value={value}&from={unit}&to={unit}' },
        { name: 'domain', path: '/domain' },
        { name: 'infos', path: '/infos' },
        { name: 'personal', path: '/personal' },
        { name: 'qrcode', path: '/qrcode?url={URL}' },
        { name: 'username', path: '/username' },
        { name: 'website', path: '/website' },
    ],
    post: [{ name: 'token', path: '/token' }],
};

const v2 = {
    get: merge(v1.get, [{ name: 'chat', path: '/chat' }]),
    post: merge(v1.post, [
        {
            name: 'chat',
            children: {
                chat: '/chat',
                private: '/chat/private',
            } as Record<string, string>,
        },
        { name: 'hash', path: '/hash' },
        {
            name: 'tic_tac_toe',
            children: {
                tic_tac_toe: '/tic-tac-toe',
                fetch: '/tic-tac-toe/fetch',
                list: '/tic-tac-toe/list',
            } as Record<string, string>,
        },
    ]),
};

const v3 = {
    get: merge(v2.get, [
        { name: 'levenshtein', path: '/levenshtein?str1={string}&str2={string}' },
        {
            name: 'time',
            path: '/time(?type={type}&start={timestamp}&end={timestamp}&format={format}&timezone={timezone})',
        },
    ]),
    post: merge(v2.post, [{ name: 'hyperplanning', path: '/hyperplanning' }]),
};

const v4 = {
    get: merge(v3.get, [
        { name: 'dice', path: '/dice?roll={NdX+M}' },
        { name: 'statistics', path: '/statistics?values={n1,n2,n3,...}' },
    ]),
    post: [...v3.post],
};

export const versions: Record<string, VersionConfig> = {
    v1: { endpoints: v1, modules: apiv3 },
    v2: { endpoints: v2, modules: apiv3 },
    v3: { endpoints: v3, modules: apiv3 },
    v4: { endpoints: v4, modules: apiv4 },
};
