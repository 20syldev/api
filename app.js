// Import modules
import * as apiv3 from './modules/v3.js';

// Import dependencies
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import { urlencoded, json } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Define allowed versions & endpoints for each version
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
        { name: 'website', path: '/website' }
    ],
    post: [
        { name: 'token', path: '/token' }
    ]
};
const v2 = {
    get: [
        ...v1.get,
        { name: 'chat', path: '/chat' }
    ],
    post: [
        ...v1.post,
        {
            name: 'chat',
            children: {
                chat: '/chat',
                private: '/chat/private'
            }
        },
        { name: 'hash', path: '/hash' },
        {
            name: 'tic_tac_toe',
            children: {
                tic_tac_toe: '/tic-tac-toe',
                fetch: '/tic-tac-toe/fetch',
                list: '/tic-tac-toe/list'
            }
        },
        { name: 'token', path: '/token' }
    ]
};
const v3 = {
    get: [
        ...v2.get,
        { name: 'levenshtein', path: '/levenshtein?str1={string}&str2={string}' },
        { name: 'time', path: '/time(?type={type}&start={timestamp}&end={timestamp}&format={format}&timezone={timezone})' },
    ],
    post: [
        ...v2.post,
        { name: 'hyperplanning', path: '/hyperplanning' }
    ]
};
const versions = {
    v1: {
        endpoints: v1,
        modules: apiv3
    },
    v2: {
        endpoints: v2,
        modules: apiv3
    },
    v3: {
        endpoints: v3,
        modules: apiv3
    }
};

// API storage
const logs = [], ipLimits = {};

// Chat storage
const chatStorage = {
    messages: [],
    privateChats: {},
    sessions: {},
    rateLimits: {}
};

// Tic-Tac-Toe storage
const ticTacToeStorage = {
    games: {},
    sessions: {},
    rateLimits: {}
};

// Define global variables
let contributions, lastFetch = 0, requests = 0, requestLimit, resetTime = Date.now() + 3600000;

// ----------- ----------- MIDDLEWARES SETUP ----------- ----------- //

dotenv.config();

// CORS & Express setup
app.set('trust proxy', 1);
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(urlencoded({ extended: true }));
app.use(json());

// Set favicon for API
app.use('/favicon.ico', express.static(join(__dirname, 'src', 'favicon.ico')));

// Display robots.txt
app.use('/robots.txt', express.static(join(__dirname, 'robots.txt')));

// Return formatted JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.jsonResponse = (data) => {
        res.send(JSON.stringify(data, null, 2));
    };
    next();
});

// Too many requests
app.use((req, res, next) => {
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const token = req.headers.authorization?.split(' ')[1] || '';

    const now = Date.now();
    const minute = Math.floor(now / 60000) % 60;
    const hour = Math.floor(now / 3600000) % 24;

    const business = process.env.BUSINESS_TOKEN_LIST?.split(' ') || [];
    const pro = process.env.PRO_TOKEN_LIST?.split(' ') || [];
    const advanced = process.env.ADVANCED_TOKEN_LIST?.split(' ') || [];

    if (token && ![...business, ...pro, ...advanced].includes(token) || token === 'undefined') {
        return res.status(401).jsonResponse({
            message: 'Unauthorized',
            error: 'Invalid token.',
            status: '401'
        });
    }

    if (business.includes(token) && !business.includes('undefined')) requestLimit = process.env.BUSINESS_LIMIT;
    else if (pro.includes(token) && !pro.includes('undefined')) requestLimit = process.env.PRO_LIMIT;
    else if (advanced.includes(token) && !advanced.includes('undefined')) requestLimit = process.env.ADVANCED_LIMIT;
    else requestLimit = process.env.DEFAULT_LIMIT;

    if (now > resetTime) requests = 0, resetTime = now + 3600000;
    if (++requests > Math.max(process.env.GLOBAL_LIMIT, requestLimit)) {
        return res.status(429).jsonResponse({ message: 'Too Many Requests' });
    }

    if (['__proto__', 'constructor', 'prototype'].includes(ip)) {
        return res.status(400).jsonResponse({ message: 'Invalid IP address' });
    }

    if (!ipLimits[ip]) ipLimits[ip] = {};
    if (!ipLimits[ip][hour]) ipLimits[ip][hour] = {};
    ipLimits[ip][hour][minute] = (ipLimits[ip][hour][minute] || 0) + 1;

    if (ipLimits[ip][hour][minute] > requestLimit) {
        return res.status(429).jsonResponse({
            message: 'Too Many Requests (IP limited), authenticate to increase the limit',
            error: `You have exceeded the limit of ${requestLimit} requests per hour.`,
            reset: `Reset in ${((resetTime - now) / 60000).toFixed(0)} minutes.`,
            status: '429'
        });
    }

    Object.keys(ipLimits[ip]).forEach(h => { if (h != hour) delete ipLimits[ip][h]; });

    next();
});

// Save and send logs
app.use((req, res, next) => {
    if (req.method === 'HEAD') return next();
    if (req.originalUrl === '/logs') return next();

    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;

    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const platform = req.headers['sec-ch-ua-platform']?.replace(/"/g, '');

    res.on('finish', () => {
        const status = res.statusCode === 304 ? 200 : res.statusCode;
        const duration = `${Date.now() - startTime}ms`;

        logs.push({ timestamp, method, url, status, duration, platform });
        console.log(`[${new Date().toISOString()}] ${method} ${url} ${res.statusCode} - ${duration} - ${ip}`);
        if (logs.length > 1000) logs.shift();
    });
    next();
});

// Internal Server Error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).jsonResponse({
        message: 'Internal Server Error',
        error: err.message,
        documentation: 'https://docs.sylvain.pro',
        status: '500'
    });
});

// Check if version exists
app.use('/:version', (req, res, next) => {
    const { version } = req.params;
    const latest = Object.keys(versions).pop();
    const endpoint = req.originalUrl.split('/').slice(2).join('/');

    req.version = version;
    req.latest = latest;

    if (['latest', 'fr', 'en'].includes(version)) {
        return res.redirect(endpoint ? `/${latest}/${endpoint}` : `/${latest}`);
    }

    if (version === 'logs') return res.jsonResponse(logs);

    if (!versions[version] && version !== 'logs') {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Invalid API version (${version}).`,
            documentation: `https://docs.sylvain.pro/${latest}`,
            status: '404'
        });
    }

    req.module = versions[version].modules;

    if (!req.module) {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Module not found for version ${version}.`,
            documentation: `https://docs.sylvain.pro/${latest}`,
            status: '404'
        });
    }

    next();
});

// Check if endpoint exists
app.use('/:version/:endpoint', (req, res, next) => {
    const { version, endpoint } = req.params;

    req.version = version;
    req.endpoint = endpoint;

    if (!req.endpoint) {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Endpoint '${endpoint}' does not exist in ${req.version}.`,
            documentation: `https://docs.sylvain.pro/${versions[version.length - 1]}`,
            status: '404'
        });
    }
    next();
});

// ----------- ----------- MAIN ENDPOINTS ----------- ----------- //

// Main route
app.get('/', (req, res) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const links = Object.keys(versions).reduce((link, version) => {
        link[version] = `${base}/${version}`;
        return link;
    }, {});

    res.jsonResponse({
        documentation: 'https://docs.sylvain.pro',
        latest: `${base}/latest`,
        logs: `${base}/logs`,
        versions: links
    });
});

// Display version information
app.get('/:version', (req, res) => {
    const { version } = req.params;

    if (!versions[version]) {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Invalid API version (${version}).`,
            documentation: `https://docs.sylvain.pro/${Object.keys(versions).pop()}`,
            status: '404'
        });
    }

    const endpoints = Object.keys(versions[version].endpoints).reduce((acc, method) => {
        acc[method] = versions[version].endpoints[method]
            .filter(({ name }) => name !== 'website')
            .sort((a, b) => a.name.localeCompare(b.name))
            .reduce((group, endpoint) => {
                if (endpoint.children) {
                    group[endpoint.name] = Object.keys(endpoint.children)
                        .sort((a, b) => a.localeCompare(b))
                        .reduce((childGroup, childName) => {
                            childGroup[childName] = `/${version}${endpoint.children[childName]}`;
                            return childGroup;
                        }, {});
                } else {
                    group[endpoint.name] = `/${version}${endpoint.path}`;
                }
                return group;
            }, {});
        return acc;
    }, {});

    res.jsonResponse({
        version,
        documentation: `https://docs.sylvain.pro/${version}`,
        endpoints
    });
});

// ----------- ----------- GET ENDPOINTS ----------- ----------- //

// Algorithms
app.get('/:version/algorithms', (req, res) => {
    const { method, value, value2 } = req.query;
    const { version } = req.params;

    if (!req.module.algorithms || !req.module.algorithms[method]) {
        return res.jsonResponse({
            error: 'Please provide a valid algorithm (?method={algorithm})',
            documentation: `https://docs.sylvain.pro/${version}/en/algorithms`
        });
    }

    try {
        const answer = req.module.algorithms[method](value, value2);
        res.jsonResponse({ answer });
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${version}/en/algorithms`
        });
    }
});

// Generate captcha
app.get('/:version/captcha', (req, res) => {
    const text = req.query.text;

    if (!text) return res.jsonResponse({ error: 'Please provide a valid argument (?text={text})' });

    try {
        const result = req.module.captcha(text);
        res.type('png').send(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/captcha`
        });
    }
});

// Display stored data
app.get('/:version/chat', (req, res) => {
    try {
        const messages = req.module.chat('fetch', {
            username: 'system',
            storage: chatStorage
        });
        res.jsonResponse(messages);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// GET private chat error
app.get('/:version/chat/private', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Generate color
app.get('/:version/color', (req, res) => {
    try {
        const result = req.module.color();
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/color`
        });
    }
});

// Convert units
app.get('/:version/convert', (req, res) => {
    const { value, from, to } = req.query;

    if (!value || isNaN(value)) return res.jsonResponse({ error: 'Please provide a valid value (?value={value})' });
    if (!from) return res.jsonResponse({ error: 'Please provide a valid source unit (&from={unit})' });
    if (!to) return res.jsonResponse({ error: 'Please provide a valid target unit (&to={unit})' });

    try {
        const result = req.module.convert(value, from, to);
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/convert`
        });
    }
});

// Generate domain informations
app.get('/:version/domain', (req, res) => {
    try {
        const result = req.module.domain();
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/domain`
        });
    }
});

// GET planning error
app.get('/:version/hyperplanning', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// GET hash error
app.get('/:version/hash', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Display API informations
app.get('/:version/infos', (req, res) => {
    const endpoints = Object.values(versions[req.version].endpoints).flat();

    const paths = endpoints.flatMap(e => e.children
        ? Object.values(e.children)
        : (e.path ? [e.path] : []));

    res.jsonResponse({
        endpoints: new Set(paths).size,
        last_version: Object.keys(versions).pop(),
        documentation: 'https://docs.sylvain.pro',
        github: 'https://github.com/20syldev/api',
        creation: 'November 25th 2024',
    });
});

// Calculate Levenshtein distance
app.get('/:version/levenshtein', (req, res) => {
    const { str1, str2 } = req.query;

    if (!str1 || typeof str1 !== 'string') return res.jsonResponse({ error: 'Please provide a first string (?str1={string})' });
    if (!str2 || typeof str2 !== 'string') return res.jsonResponse({ error: 'Please provide a second string (&str2={string})' });

    try {
        const result = req.module.levenshtein(str1, str2);
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/levenshtein`
        });
    }
});

// Generate personal data
app.get('/:version/personal', (req, res) => {
    try {
        const result = req.module.personal();
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/personal`
        });
    }
});

// Generate QR Code
app.get('/:version/qrcode', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.jsonResponse({ error: 'Please provide a valid url (?url={URL})' });

    try {
        const result = await req.module.qrcode(url);
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/qrcode`
        });
    }
});

// GET tic-tac-toe game error
app.get('/:version/tic-tac-toe', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// GET tic-tac-toe fetch error
app.get('/:version/tic-tac-toe/fetch', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// GET tic-tac-toe list error
app.get('/:version/tic-tac-toe/list', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Display or generate time informations
app.get('/:version/time', (req, res) => {
    const { type = 'live', start, end, format, timezone } = req.query;

    const validFormats = ['iso', 'utc', 'timestamp', 'locale', 'date', 'time', 'year', 'month', 'day', 'hour', 'minute', 'second', 'ms', 'dayOfWeek', 'dayOfYear', 'weekNumber', 'timezone', 'timezoneOffset'];
    const validTimezones = ['UTC', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];

    if (type !== 'live' && type !== 'random') return res.jsonResponse({ error: 'Please provide a valid type (?type={type})' });
    if (start && !Date.parse(start)) return res.jsonResponse({ error: 'Please provide a valid start date (?start={YYYY-MM-DD})' });
    if (end && !Date.parse(end)) return res.jsonResponse({ error: 'Please provide a valid end date (?end={YYYY-MM-DD})' });
    if (format && !validFormats.includes(format)) return res.jsonResponse({ error: 'Please provide a valid format (?format={format})' });
    if (timezone && !validTimezones.includes(timezone)) return res.jsonResponse({ error: 'Please provide a valid timezone (?timezone={timezone})' });

    try {
        const time = req.module.time(type, start, end, format, timezone);
        res.jsonResponse(time);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/time`
        });
    }
});

// GET token error
app.get('/:version/token', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Generate username
app.get('/:version/username', (req, res) => {
    try {
        const result = req.module.username();
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/username`
        });
    }
});

// Display informations for owner's website
app.get('/:version/website', async (req, res) => {
    const currentTime = Date.now();

    if (currentTime - lastFetch >= 10 * 60 * 1000) {
        try {
            const username = '20syldev';
            const token = process.env.GITHUB_TOKEN;
            const today = new Date().toISOString().split('T')[0];
            const monthFirst = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

            const query = `
            {
              user(login: "${username}") {
                contributionsCollection(from: "${today}T00:00:00Z") {
                  contributionCalendar {
                    totalContributions
                  }
                }
                contributions_month: contributionsCollection(from: "${monthFirst}T00:00:00Z") {
                contributionCalendar {
                    totalContributions
                  }
                }
                contributions_year: contributionsCollection(from: "${lastYear}T00:00:00Z") {
                  contributionCalendar {
                    totalContributions
                  }
                }
              }
            }`;

            const apiResponse = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!apiResponse.ok) throw new Error('Error fetching data.');

            const data = await apiResponse.json();
            const user = data?.data?.user;

            contributions = {
                today: user?.contributionsCollection?.contributionCalendar?.totalContributions || 0,
                month: user?.contributions_month?.contributionCalendar?.totalContributions || 0,
                year: user?.contributions_year?.contributionCalendar?.totalContributions || 0,
            };

            lastFetch = currentTime;
        } catch { contributions = { today: 0, month: 0, year: 0 }; }
    }

    res.jsonResponse({
        versions: {
            api: process.env.API,
            cdn: process.env.CDN,
            coop_api: process.env.COOP_API,
            coop_status: process.env.COOP_STATUS,
            chat: process.env.CHAT,
            digit: process.env.DIGIT,
            doc_coopbot: process.env.DOC_COOPBOT,
            docs: process.env.DOCS,
            donut: process.env.DONUT,
            drawio_plugin: process.env.DRAWIO_PLUGIN,
            flowers: process.env.FLOWERS,
            g_2048: process.env.G_2048,
            gemsync: process.env.GEMSYNC,
            gitsite: process.env.GITSITE,
            lebonchar: process.env.LEBONCHAR,
            logs: process.env.LOGS,
            logvault: process.env.LOGVAULT,
            lyah: process.env.LYAH,
            minify: process.env.MINIFY,
            monitoring: process.env.MONITORING,
            morpion: process.env.MORPION,
            nitrogen: process.env.NITROGEN,
            old_database: process.env.OLD_DATABASE,
            password: process.env.PASSWORD,
            php: process.env.PHP,
            ping: process.env.PING,
            portfolio: process.env.PORTFOLIO,
            python_api: process.env.PYTHON_API,
            readme: process.env.README,
            timestamp: process.env.TIMESTAMP,
            terminal: process.env.TERMINAL,
            wrkit: process.env.WRKIT,
            zpki: process.env.ZPKI
        },
        patched_projects: process.env.PATCH?.split(' ') || [],
        updated_projects: process.env.RECENT?.split(' ') || [],
        new_projects: process.env.NEW?.split(' ') || [],
        sub_domains: process.env.DOMAINS?.split(' ') || [],
        stats: {
            1: process.env.STATS1,
            2: process.env.STATS2,
            3: process.env.STATS3,
            4: process.env.STATS4,
            5: Object.keys(ipLimits).length,
            today: contributions.today.toString(),
            this_month: contributions.month.toString(),
            last_year: contributions.year.toString(),
        },
        notif_tag: process.env.TAG,
        active: process.env.ACTIVE
    });
});

// ----------- ----------- POST ENDPOINTS ----------- ----------- //

// Store chat messages
app.post('/:version/chat', (req, res) => {
    const { username, message, timestamp, session, token } = req.body || {};

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!message) return res.jsonResponse({ error: 'Please provide a message (&message={message})' });
    if (!session) return res.jsonResponse({ error: 'Please provide a valid session ID (&session={ID})' });

    try {
        const result = req.module.chat('message', {
            username,
            message,
            timestamp,
            session,
            token,
            storage: chatStorage
        });
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// Display a private chat with a token
app.post('/:version/chat/private', (req, res) => {
    const { username, token } = req.body || {};

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!token) return res.jsonResponse({ error: 'Please provide a valid token (&token={key}).' });

    try {
        const messages = req.module.chat('private', {
            username,
            token,
            storage: chatStorage
        });
        res.jsonResponse(messages);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// Generate hash
app.post('/:version/hash', (req, res) => {
    const { text, method } = req.body || {};

    if (!text) return res.jsonResponse({ error: 'Please provide a text (?text={text})' });
    if (!method) return res.jsonResponse({
        error: 'Please provide a valid hash algorithm (&method={algorithm})',
        documentation: `https://docs.sylvain.pro/${req.version}/en/hash`
    });

    try {
        const result = req.module.hash(text, method);
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/hash`
        })
    }
});

// Display a planning from an ICS file
app.post('/:version/hyperplanning', async (req, res) => {
    const { url, detail } = req.body || {};

    if (!url) return res.jsonResponse({ error: 'Please provide a valid ICS file URL (?url={URL})' });

    try {
        const hyperplanning = await req.module.hyperplanning(url, detail);
        res.jsonResponse(hyperplanning);
    } catch (err){
        res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/hyperplanning`
        });
    }
});

// Store tic tac toe games
app.post('/:version/tic-tac-toe', (req, res) => {
    const { username, move, session, game } = req.body || {};

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!move) return res.jsonResponse({ error: 'Please provide a valid move (&move={move})' });
    if (!session) return res.jsonResponse({ error: 'Please provide a valid session ID (&session={ID})' });
    if (!game) return res.jsonResponse({ error: 'Please provide a valid game ID (&game={ID})' });

    try {
        const result = req.module.tic_tac_toe('play', {
            username,
            move,
            session,
            game,
            storage: ticTacToeStorage
        });
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// Display a tic tac toe game with a token
app.post('/:version/tic-tac-toe/fetch', (req, res) => {
    const { username, game } = req.body || {};
    const privateGame = (req.body || {}).private;

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });

    try {
        const result = req.module.tic_tac_toe('fetch', {
            username,
            game,
            private: privateGame,
            storage: ticTacToeStorage
        });
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// List public tic tac toe games
app.post('/:version/tic-tac-toe/list', (req, res) => {
    try {
        const result = req.module.tic_tac_toe('list', {
            storage: ticTacToeStorage
        });
        res.jsonResponse(result);
    } catch (err) {
        res.jsonResponse({ error: err.message });
    }
});

// Generate Token
app.post('/:version/token', (req, res) => {
    let { len, type } = req.body || {};

    len = parseInt(len || 24, 10);
    type = type ? type.toLowerCase() : 'alpha';

    if (isNaN(len) || len < 0) return res.jsonResponse({ error: 'Invalid number.' });
    if (len > 4096) return res.jsonResponse({ error: 'Length cannot exceed 4096.' });
    if (len < 12) return res.jsonResponse({ error: 'Length cannot be less than 12.' });

    try {
        const token = req.module.token(len, type);
        res.jsonResponse({ token });
    } catch (err) {
        return res.jsonResponse({
            error: err.message,
            documentation: `https://docs.sylvain.pro/${req.version}/en/token`
        });
    }
});

// ----------- ----------- SERVER SETUP ----------- ----------- //

app.listen(3000, () => console.log('API is running on\n    - http://127.0.0.1:3000\n    - http://localhost:3000'));
