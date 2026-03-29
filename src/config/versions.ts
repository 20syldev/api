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
    };
    modules: typeof apiv3 | typeof apiv4;
}

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
    get: [...v1.get, { name: 'chat', path: '/chat' }],
    post: [
        ...v1.post,
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
        { name: 'token', path: '/token' },
    ],
};

const v3 = {
    get: [
        ...v2.get,
        { name: 'levenshtein', path: '/levenshtein?str1={string}&str2={string}' },
        {
            name: 'time',
            path: '/time(?type={type}&start={timestamp}&end={timestamp}&format={format}&timezone={timezone})',
        },
    ],
    post: [...v2.post, { name: 'hyperplanning', path: '/hyperplanning' }],
};

const v4 = {
    get: [...v3.get],
    post: [...v3.post],
};

export const versions: Record<string, VersionConfig> = {
    v1: { endpoints: v1, modules: apiv3 },
    v2: { endpoints: v2, modules: apiv3 },
    v3: { endpoints: v3, modules: apiv3 },
    v4: { endpoints: v4, modules: apiv4 },
};
