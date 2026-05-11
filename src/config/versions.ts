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
            path: '/time(?type={live|random|countdown}&target={date}&start={timestamp}&end={timestamp}&format={format}&timezone={timezone})',
        },
    ]),
    post: merge(v2.post, [{ name: 'hyperplanning', path: '/hyperplanning' }]),
};

const v4 = {
    get: merge(v3.get, [
        { name: 'address', path: '/address(&country={code}&count={n})' },
        { name: 'agent', path: '/agent(&ua={string})' },
        {
            name: 'captcha',
            path: '/captcha(&text={text}&length={n}&width={px}&height={px}&noise={low|medium|high}&bg={hex}&color={hex})',
        },
        { name: 'color', path: '/color(&hex={hex})' },
        { name: 'convert', path: '/convert?value={value}&from={unit}&to={unit}' },
        { name: 'cron', path: '/cron?expr={expression}(&count={n}&from={date}&timezone={timezone})' },
        { name: 'dice', path: '/dice?roll={NdX+M}' },
        { name: 'encode', path: '/encode?method={method}&text={text}(&shift={shift})' },
        { name: 'geo', path: '/geo?lat1={lat}&lon1={lon}&lat2={lat}&lon2={lon}' },
        { name: 'headers', path: '/headers(&filter={header1,header2})' },
        { name: 'ip', path: '/ip(&address={ip})' },
        { name: 'palette', path: '/palette?color={#hex}&type={type}' },
        {
            name: 'password',
            path: '/password(&type={random|passphrase}&length={n}&uppercase={bool}&lowercase={bool}&digits={bool}&symbols={bool}&exclude={chars}&count={n}&separator={char})',
        },
        {
            name: 'placeholder',
            path: '/placeholder?type={image|skeleton}&width={w}&height={h}(&bg={hex}&color={hex}&text={text}&rows={n}&avatar={bool})',
        },
        {
            name: 'qrcode',
            path: '/qrcode?url={URL}(&size={px}&margin={n}&correction={L|M|Q|H}&dark={hex}&light={hex}&icon={URL}&iconSize={px}&iconPadding={px}&iconRadius={px}&format={png|base64})',
        },
        { name: 'regex', path: '/regex?pattern={regex}&text={string}(&flags={flags})' },
        { name: 'statistics', path: '/statistics?values={n1,n2,n3,...}' },
        { name: 'text', path: '/text?method={method}(&value={value}&type={type}&count={count}&lang={lang})' },
        { name: 'validate', path: '/validate?type={type}&value={value}' },
    ]),
    post: [...v3.post],
};

export const versions: Record<string, VersionConfig> = {
    v1: { endpoints: v1, modules: apiv3 },
    v2: { endpoints: v2, modules: apiv3 },
    v3: { endpoints: v3, modules: apiv3 },
    v4: { endpoints: v4, modules: apiv4 },
};
