import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import ical from 'ical.js';
import { createCanvas } from 'canvas';
import { randomBytes, getHashes, createHash } from 'crypto';
import { urlencoded, json } from 'express';
import { factorial } from 'mathjs';
import { dirname, join } from 'path';
import { toDataURL } from 'qrcode';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Define allowed versions & endpoints for each version
const versions = ['v1', 'v2', 'v3'];
const endpoints = {
    v1: ['algorithms', 'captcha', 'color', 'convert', 'domain', 'infos', 'personal', 'qrcode', 'token', 'username', 'website'],
    v2: ['algorithms', 'captcha', 'chat', 'color', 'convert', 'domain', 'hash', 'infos', 'personal', 'qrcode', 'tic-tac-toe', 'token', 'username', 'website'],
    v3: ['algorithms', 'captcha', 'chat', 'color', 'convert', 'domain', 'hash', 'hyperplanning', 'infos', 'levenshtein', 'personal', 'qrcode', 'tic-tac-toe', 'time', 'token', 'username', 'website']
};

// Arrowed functions (formatting, math & random)
const formatDate = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const genID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(randomBytes(5)).map(b => chars[b % chars.length]).join('');
};
const genIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
const genToken = (chars, length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Store data
const logs = [], chat = [], privateChats = {}, sessions = {}, rateLimits = {}, games = {};

// Define global variables
let contributions, lastFetch = 0, requests = 0, resetTime = Date.now() + 10000;

// ----------- ----------- MAIN FUNCTIONS ----------- ----------- //

/**
 * Check the game result of a Tic-Tac-Toe game.
 * 
 * @param {Array} moves - The moves of the game.
 * @returns {Object} - The result of the game.
 */
function checkGame(moves) {
    let board = Array(3).fill().map(() => Array(3).fill(null));
    let playerSymbols = {};
    let playersOrder = [];

    moves.forEach(({ username, move }) => {
        if (!playerSymbols[username]) {
            playersOrder.push(username);
            playerSymbols[username] = playersOrder.length === 1 ? 'X' : 'O';
        }
        let [row, col] = move.split('-').map(Number);
        board[row - 1][col - 1] = playerSymbols[username];
    });

    const checkWinner = (symbol) => {
        for (let i = 0; i < 3; i++) {
            if (board[i][0] === symbol && board[i][1] === symbol && board[i][2] === symbol) return true;
            if (board[0][i] === symbol && board[1][i] === symbol && board[2][i] === symbol) return true;
        }
        if (board[0][0] === symbol && board[1][1] === symbol && board[2][2] === symbol) return true;
        if (board[0][2] === symbol && board[1][1] === symbol && board[2][0] === symbol) return true;
        return false;
    };

    let winner = Object.keys(playerSymbols).find(player => checkWinner(playerSymbols[player]));
    let isTie = !winner && moves.length === 9;
    let loser = winner && playersOrder.length === 2 ? playersOrder.find(player => player !== winner) : null;

    return { winner, loser, tie: isTie };
}

// ----------- ----------- MIDDLEWARES SETUP ----------- ----------- //

dotenv.config();

// CORS & Express setup
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
    if (Date.now() > resetTime) requests = 0, resetTime = Date.now() + 10000;
    if (++requests > 1000) return res.status(429).jsonResponse({ message: 'Too Many Requests' });
    next();
});

// Save and send logs
app.use((req, res, next) => {
    if (req.method === 'HEAD') return next();
    if (req.originalUrl === '/logs') return next();

    const startTime = Date.now();

    res.on('finish', () => {
        logs.push({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode === 304 ? 200 : res.statusCode,
            duration: `${Date.now() - startTime}ms`,
            platform: req.headers['sec-ch-ua-platform']?.replace(/"/g, ''),
        });
        if (logs.length > 1000) logs.shift();
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - startTime}ms`);
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
    const latest = versions[versions.length - 1];
    const endpoint = req.originalUrl.split('/').slice(2).join('/');

    if (['latest', 'fr', 'en'].includes(version)) {
        return res.redirect(endpoint ? `/${latest}/${endpoint}` : `/${latest}`);
    }

    if (!versions.includes(version) && version !== 'logs') {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Invalid API version (${version}).`,
            documentation: `https://docs.sylvain.pro/${versions.at(-1)}`,
            status: '404'
        });
    }
    next();
});

// Check if endpoint exists
app.use('/:version/:endpoint', (req, res, next) => {
    const { version, endpoint } = req.params;

    if (!versions.includes(version) || !endpoints[version].includes(endpoint)) {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Endpoint '${endpoint}' does not exist in ${version}.`,
            documentation: `https://docs.sylvain.pro/${versions.at(-1)}`,
            status: '404'
        });
    }
    next();
});

// ----------- ----------- MAIN ENDPOINTS ----------- ----------- //

// Main route
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.jsonResponse({
        documentation: 'https://docs.sylvain.pro',
        latest: 'https://api.sylvain.pro/latest',
        logs: 'https://api.sylvain.pro/logs',
        versions: { 
            v1: 'https://api.sylvain.pro/v1',
            v2: 'https://api.sylvain.pro/v2',
            v3: 'https://api.sylvain.pro/v3'
        }
    });
});

// Display v1 endpoints
app.get('/v1', (req, res) => {
    res.jsonResponse({
        version: 'v1',
        documentation: 'https://docs.sylvain.pro/v1',
        endpoints: {
            get: {
                algorithm: '/v1/algorithms?method={algorithm}&value={value}(&value2={value2})',
                captcha: '/v1/captcha?text={text}',
                color: '/v1/color',
                convert: '/v1/convert?value={value}&from={unit}&to={unit}',
                domain: '/v1/domain',
                infos: '/v1/infos',
                personal: '/v1/personal',
                qrcode: '/v1/qrcode?url={URL}',
                username: '/v1/username'
            },
            post: {
                token: '/v1/token'
            }
        }
    });
});

// Display v2 endpoints
app.get('/v2', (req, res) => {
    res.jsonResponse({
        version: 'v2',
        documentation: 'https://docs.sylvain.pro/v2',
        endpoints: {
            get: {
                algorithm: '/v2/algorithms?method={algorithm}&value={value}(&value2={value2})',
                captcha: '/v2/captcha?text={text}',
                chat: '/v2/chat',
                color: '/v2/color',
                convert: '/v2/convert?value={value}&from={unit}&to={unit}',
                domain: '/v2/domain',
                infos: '/v2/infos',
                personal: '/v2/personal',
                qrcode: '/v2/qrcode?url={URL}',
                username: '/v2/username'
            },
            post: {
                chat: {
                    chat: '/v2/chat',
                    private: '/v2/chat/private'
                },
                hash: '/v2/hash',
                tic_tac_toe: {
                    tic_tac_toe: '/v2/tic-tac-toe',
                    fetch: '/v2/tic-tac-toe/fetch'
                },
                token: '/v2/token'
            }
        }
    });
});

// Display v3 endpoints
app.get('/v3', (req, res) => {
    res.jsonResponse({
        version: 'v3',
        documentation: 'https://docs.sylvain.pro/v3',
        endpoints: {
            get: {
                algorithm: '/v3/algorithms?method={algorithm}&value={value}(&value2={value2})',
                captcha: '/v3/captcha?text={text}',
                chat: '/v3/chat',
                color: '/v3/color',
                convert: '/v3/convert?value={value}&from={unit}&to={unit}',
                domain: '/v3/domain',
                infos: '/v3/infos',
                levenshtein: '/v3/levenshtein?str1={string}&str2={string}',
                personal: '/v3/personal',
                qrcode: '/v3/qrcode?url={URL}',
                time: '/v3/time(?type={type}&start={timestamp}&end={timestamp}&format={format}&timezone={timezone})',
                username: '/v3/username'
            },
            post: {
                chat: {
                    chat: '/v3/chat',
                    private: '/v3/chat/private'
                },
                hash: '/v3/hash',
                hyperplanning: '/v3/hyperplanning',
                tic_tac_toe: {
                    tic_tac_toe: '/v3/tic-tac-toe',
                    fetch: '/v3/tic-tac-toe/fetch'
                },
                token: '/v3/token'
            }
        }
    });
});

// Display logs
app.get('/logs', (req, res) => res.jsonResponse(logs));

// ----------- ----------- GET ENDPOINTS ----------- ----------- //

// Algorithms
app.get('/:version/algorithms', (req, res) => {
    const { method, value, value2 } = req.query;
    const { version } = req.params;

    if (!['anagram', 'bubblesort', 'factorial', 'fibonacci', 'gcd', 'isprime', 'palindrome', 'primefactors', 'primelist', 'reverse'].includes(method)) {
        return res.jsonResponse({
            error: 'Please provide a valid algorithm (?method={algorithm})',
            documentation: `https://docs.sylvain.pro/${version}/algorithms`
        });
    }
    if (!value) return res.jsonResponse({ error: 'Please provide a valid value (&value={value})' });

    if (method === 'anagram') {
        if (!value2) return res.jsonResponse({ error: 'Please provide a second value (&value2={value})' });
        return res.jsonResponse({ answer: value.split('').sort().join('') === value2.split('').sort().join('') });
    }

    if (method === 'bubblesort') {
        const arr = value.split(',').map(Number);
        const n = arr.length;
        for (let i = 0; i < n-1; i++) {
            for (let j = 0; j < n-i-1; j++) {
                if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; 
            }
        }
        return res.jsonResponse({ answer: arr });
    }

    if (method === 'factorial') {
        if (isNaN(value) || value < 0 || value > 170) return res.jsonResponse({ error: 'Please provide a valid number between 0 and 170.' });
        return res.jsonResponse({ answer: factorial(value) });
    }

    if (method === 'fibonacci') {
        let fib = [0, 1];
        for (let i = 2; i < parseInt(value); i++) fib.push(fib[i - 1] + fib[i - 2]);
        return res.jsonResponse({ answer: fib.slice(0, parseInt(value)) });
    }

    if (method === 'gcd') {
        if (!value2) return res.jsonResponse({ error: 'Please provide a second value (&value2={value})' });
        if (isNaN(value) || isNaN(value2)) return res.jsonResponse({ error: 'Invalid numbers.' });
        return res.jsonResponse({ answer: gcd(value, value2) });
    }

    if (method === 'isprime') {
        let isPrime = true;
        if (isNaN(value) || value < 1) return res.jsonResponse({ error: 'Please provide a valid number greater than or equal to 1.' });
        for (let i = 2; i <= Math.sqrt(value); i++) {
            if (value % i === 0) {
                isPrime = false;
                break;
            }
        }
        return res.jsonResponse({ answer: isPrime });
    }

    if (method === 'palindrome') return res.jsonResponse({ answer: value === value.split('').reverse().join('') });

    if (method === 'primefactors') {
        let num = value;
        let factors = [];
        if (isNaN(num) || num < 2 || num > 100000) return res.jsonResponse({ error: 'Please provide a valid number between 2 and 100 000.' });
        for (let i = 2; i <= num; i++) {
            while (num % i === 0) {
                factors.push(i);
                num /= i;
            }
        }
        return res.jsonResponse({ answer: factors });
    }

    if (method === 'primelist') {
        const primes = [];
        if (isNaN(value) || value < 2 || value > 10000) return res.jsonResponse({ error: 'Please provide a valid number between 2 and 10 000.' });
        for (let i = 2; i <= value; i++) {
            let isPrime = true;
            for (let j = 2; j <= Math.sqrt(i); j++) {
                if (i % j === 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) primes.push(i);
        }
        return res.jsonResponse({ answer: primes });
    }

    if (method === 'reverse') return res.jsonResponse({ answer: value.split('').reverse().join('') });
});

// Generate captcha
app.get('/:version/captcha', (req, res) => {
    const captcha = req.query.text;

    if (!captcha) return res.jsonResponse({ error: 'Please provide a valid argument (?text={text})' });

    const size = 60, font = '60px Comic Sans Ms', width = captcha.length * size, height = 120;
    const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.lineWidth = Math.random() * 2;
        ctx.stroke();
    }

    let x = (canvas.width + 20 - width) / 2;
    for (let i = 0; i < captcha.length; i++) {
        const offsetX = Math.cos(i * 0.3) * 10, y = height / 2.5 + Math.floor(Math.random() * (height / 2));

        ctx.font = font;
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 192)}, ${Math.floor(Math.random() * 192)}, ${Math.floor(Math.random() * 192)})`;

        ctx.save();
        ctx.translate(x + size / 2, y);
        ctx.rotate((Math.random() - 0.5) * 0.5);
        ctx.fillText(captcha[i], -size / 2 + offsetX, 0);
        ctx.restore();

        x += size;
    }

    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = 'black';
        ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), 1.2, 1.2);
    }

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
});

// Display stored data
app.get('/:version/chat', (req, res) => {
    if (chat.length > 0) res.jsonResponse(chat);
    else res.jsonResponse({ error: 'No messages stored.' });
});

// GET private chat error
app.get('/:version/chat/private', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Generate color
app.get('/:version/color', (req, res) => {
    const r = Math.floor(Math.random() * 256), g = Math.floor(Math.random() * 256), b = Math.floor(Math.random() * 256);
    const hsl = (() => {
        const r1 = r / 255, g1 = g / 255, b1 = b / 255, max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1), l = (max + min) / 2;
        if (max === min) return [0, 0, l * 100];
        const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h = { [r1]: (g1 - b1) / d + (g1 < b1 ? 6 : 0), [g1]: (b1 - r1) / d + 2, [b1]: (r1 - g1) / d + 4 }[max];
        return [h * 60 % 360, s * 100, l * 100];
    })();
    const hsv = (() => {
        const max = Math.max(r, g, b), min = Math.min(r, g, b), v = max / 255, s = max ? (max - min) / max : 0;
        let h = max === min ? 0 : { [r]: (g - b) / (max - min), [g]: 2 + (b - r) / (max - min), [b]: 4 + (r - g) / (max - min) }[max];
        return [h * 60 % 360, s * 100, v * 100];
    })();
    const hwb = (() => {
        const [h] = hsv, whiteness = Math.min(r, g, b) / 255, blackness = 1 - Math.max(r, g, b) / 255;
        return [h, whiteness * 100, blackness * 100];
    })();
    const cmyk = (() => {
        const k = 1 - Math.max(r, g, b) / 255, c = (1 - r / 255 - k) / (1 - k) || 0, m = (1 - g / 255 - k) / (1 - k) || 0, y = (1 - b / 255 - k) / (1 - k) || 0;
        return [c, m, y, k].map(x => x * 100);
    })();
    res.jsonResponse({
        hex: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${hsl[0].toFixed(1)}, ${hsl[1].toFixed(1)}%, ${hsl[2].toFixed(1)}%)`,
        hsv: `hsv(${hsv[0].toFixed(1)}, ${hsv[1].toFixed(1)}%, ${hsv[2].toFixed(1)}%)`,
        hwb: `hwb(${hwb[0].toFixed(1)}, ${hwb[1].toFixed(1)}%, ${hwb[2].toFixed(1)}%)`,
        cmyk: `cmyk(${cmyk.map(x => x.toFixed(1)).join('%, ')}%)`
    });
});

// Convert units
app.get('/:version/convert', (req, res) => {
    const { value, from, to } = req.query;

    if (!value || isNaN(value)) return res.jsonResponse({ error: 'Please provide a valid value (?value={value})' });
    if (!from) return res.jsonResponse({ error: 'Please provide a valid source unit (&from={unit})' });
    if (!to) return res.jsonResponse({ error: 'Please provide a valid target unit (&to={unit})' });

    const conversions = {
        celsius: { fahrenheit: (val) => (val * 9) / 5 + 32, kelvin: (val) => val + 273.15 },
        fahrenheit: { celsius: (val) => ((val - 32) * 5) / 9, kelvin: (val) => ((val - 32) * 5) / 9 + 273.15 },
        kelvin: { celsius: (val) => val - 273.15, fahrenheit: (val) => ((val - 273.15) * 9) / 5 + 32 },
    };

    const convert = conversions[from.toLowerCase()]?.[to.toLowerCase()];
    if (!convert) return res.jsonResponse({ error: 'Invalid conversion units.' });

    res.jsonResponse({ from, to, value: parseFloat(value), result: convert(parseFloat(value)) });
});

// Generate domain informations
app.get('/:version/domain', (req, res) => {
    const subdomains = ['fr.', 'en.', 'docs.', 'api.', 'projects.', 'app.', 'web.', 'info.', 'dev.', 'shop.', 'blog.', 'support.', 'mail.', 'forum.'];
    const domains = ['example', 'site', 'test', 'demo', 'page', 'store', 'portfolio', 'platform', 'hub', 'network', 'service', 'cloud', 'solutions', 'company'];
    const tlds = ['.com', '.fr', '.eu', '.dev', '.net', '.org', '.io', '.tech', '.biz', '.info', '.co', '.app', '.store', '.online', '.shop', '.tv'];

    const domain = `${random(domains)}${random(tlds)}`;
    const fulldomain = `${random(subdomains)}${domain}`;

    const ips = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, genIP);
    const dns = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, genIP);

    res.jsonResponse({
        domain,
        full_domain: fulldomain,
        ip_address: ips,
        ssl_certified: Math.random() > 0.5,
        hosting_provider: random(['AWS', 'Bluehost', 'DigitalOcean', 'GitHub', 'HostGator', 'Render', 'SiteGround']),
        dns_servers: dns,
        dns_provider: random(['AWS Route 53', 'Cloudflare', 'GoDaddy', 'Google DNS', 'Namecheap']),
        traffic: `${Math.floor(Math.random() * 10000)} visits/day`,
        seo_score: Math.floor(Math.random() * 100),
        page_rank: Math.floor(Math.random() * 10),
        country: random(['Australia', 'Canada', 'France', 'Germany', 'India', 'Japan', 'UK', 'USA']),
        website_type: random(['Blog', 'Community', 'Corporate', 'Educational', 'E-commerce', 'Personal', 'Portfolio']),
        random_name: domain.split('.')[0],
        random_subdomain: fulldomain.split('.')[0],
        random_tld: domain.split('.').pop(),
        backlinks_count: Math.floor(Math.random() * 1000),
        creation_date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        expiration_date: new Date(Date.now() + Math.floor(Math.random() * 10000000000)).toISOString(),
    });
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
    res.jsonResponse({
        endpoints: endpoints[versions.at(-1)].length,
        last_version: versions.at(-1),
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

    if (str1.length > 1000) return res.jsonResponse({ error: 'First string exceeds 1000 characters.' });
    if (str2.length > 1000) return res.jsonResponse({ error: 'Second string exceeds 1000 characters.' });

    const lev = (a, b) => {
        const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= b.length; j++) m[0][j] = j;
        for (let i = 1; i <= a.length; i++)
            for (let j = 1; j <= b.length; j++)
                m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));

        return m[a.length][b.length];
    };

    res.jsonResponse({ str1, str2, distance: lev(str1, str2) });
});

// Generate personal data
app.get('/:version/personal', (req, res) => {
    const people = [
        { name: 'John Doe', social: 'john_doe', email: 'john@example.com', country: 'US' },
        { name: 'Jane Martin', social: 'jane_martin', email: 'jane@example.com', country: 'FR' },
        { name: 'Michael Johnson', social: 'mike_johnson', email: 'michael@example.com', country: 'UK' },
        { name: 'Emily Davis', social: 'emily_davis', email: 'emily@example.com', country: 'ES' },
        { name: 'Alexis Barbos', social: 'alexis_barbos', email: 'alexis@example.com', country: 'DE' },
        { name: 'Sarah Williams', social: 'sarah_williams', email: 'sarah@example.com', country: 'IT' },
        { name: 'Daniel Brown', social: 'daniel_brown', email: 'daniel@example.com', country: 'JP' },
        { name: 'Sophia Wilson', social: 'sophia_wilson', email: 'sophia@example.com', country: 'BR' },
        { name: 'James Taylor', social: 'james_taylor', email: 'james@example.com', country: 'CA' },
        { name: 'Olivia Thomas', social: 'olivia_thomas', email: 'olivia@example.com', country: 'AU' }
    ];

    const countries = {
        US: { tel: '123-456-7890', code: '1', lang: 'English' },
        FR: { tel: '06 78 90 12 34', code: '33', lang: 'French' },
        UK: { tel: '7911 123456', code: '44', lang: 'English' },
        ES: { tel: '678 901 234', code: '34', lang: 'Spanish' },
        DE: { tel: '163 555 1584', code: '49', lang: 'German' },
        IT: { tel: '345 678 9012', code: '39', lang: 'Italian' },
        JP: { tel: '080-1234-5678', code: '81', lang: 'Japanese' },
        BR: { tel: '(11) 98765-4321', code: '55', lang: 'Portuguese' },
        CA: { tel: '416-123-4567', code: '1', lang: 'English' },
        AU: { tel: '0412 345 678', code: '61', lang: 'English' }
    };

    const jobs = ['Writer', 'Artist', 'Musician', 'Explorer', 'Scientist', 'Engineer', 'Athlete', 'Doctor'];
    const hobbies = ['Reading', 'Traveling', 'Gaming', 'Cooking', 'Fitness', 'Music', 'Photography', 'Writing'];
    const cities = ['New York', 'Paris', 'London', 'Madrid', 'Berlin', 'Rome', 'Tokyo', 'Los Angeles', 'Sydney', 'São Paulo', 'Toronto'];
    const streets = ['Main St', '2nd Ave', 'Broadway', 'Park Lane', 'Elm St', 'Sunset Blvd', 'Maple St', 'Highland Rd'];

    const card = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9000) + 1000).join(' ');
    const cvc = Math.floor(Math.random() * 900) + 100;
    const expiration = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${(new Date().getFullYear() + Math.floor(Math.random() * 3)).toString().slice(-2)}`;

    const person = random(people);
    const social = person.social;
    const country = person.country;
    const phone = countries[country].tel;
    const lang = countries[country].lang;

    const age = Math.floor(Math.random() * 50) + 18;
    const birthday = new Date(Date.now() - Math.floor((Math.random() * 50 + 18) * 365.25 * 24 * 60 * 60 * 1000)).toISOString();

    let emergencyContacts = [], yearIncome = Math.floor(Math.random() * 100000), subscriptions = [], pets = [], vehicles = [];
    let civilStatus = 'Single';
    let children = 0;

    if (age >= 21 && Math.random() > 0.7) civilStatus = 'Married';

    if (civilStatus === 'Married' && age >= 25) children = Math.floor(Math.random() * 4);

    while (emergencyContacts.length < Math.floor(Math.random() * 3) + 1) {
        let emergencyContact = random(people);
        while (emergencyContact.email === person.email || emergencyContacts.some(e => e.email === emergencyContact.email)) {
            emergencyContact = random(people);
        }
        emergencyContacts.push({
            name: emergencyContact.name,
            relationship: random(['Spouse', 'Parent', 'Sibling', 'Friend']),
            phone: `+${countries[country].code} ${countries[country].tel}`
        });
    }

    while (subscriptions.length < Math.floor(Math.random() * 3) + 1) {
        let subscription = random(['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'Hulu']);
        if (!subscriptions.includes(subscription)) subscriptions.push(subscription);
    }

    while (pets.length < Math.floor(Math.random() * 3) + 1) {
        let pet = random(['Dog', 'Cat', 'Fish', 'Bird', 'None']);
        if (!pets.includes(pet)) pets.push(pet);
    }

    while (vehicles.length < Math.floor(Math.random() * 3) + 1) {
        let vehicle = random(['Car', 'Bike', 'Motorcycle', 'Bus', 'None']);
        if (!vehicles.includes(vehicle)) vehicles.push(vehicle);
    }

    res.jsonResponse({
        name: person.name,
        email: person.email,
        localisation: country,
        phone: `+${countries[country].code} ${phone}`,
        job: random(jobs),
        hobbies: random(hobbies),
        language: lang,
        card,
        cvc,
        expiration,
        address: `${Math.floor(Math.random() * 9999)} ${random(streets)}, ${random(cities)}`,
        birthday,
        civil_status: civilStatus,
        children,
        vehicle: vehicles,
        social_profiles: {
            twitter: `@${social}`,
            facebook: `facebook.com/${social}`,
            linkedin: `linkedin.com/in/${social}`,
            instagram: `instagram.com/${social}`
        },
        year_income: `${yearIncome} USD/year`,
        month_income: `${(yearIncome / 12).toFixed(2)} USD/month`,
        education: random(['High School', 'Bachelor\'s', 'Master\'s', 'PhD']),
        work_experience: `${Math.floor(Math.random() * 20)} years`,
        health_status: random(['Healthy', 'Minor Issues', 'Chronic Conditions']),
        emergency_contacts: emergencyContacts,
        subscriptions,
        pets,
    });
});

// Generate QR Code
app.get('/:version/qrcode', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.jsonResponse({ error: 'Please provide a valid url (?url={URL})' });

    try { res.jsonResponse({ qr: await toDataURL(url) }); }
    catch { res.jsonResponse({ error: 'Error generating QR code.' }); }
});

// GET tic-tac-toe game error
app.get('/:version/tic-tac-toe', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// GET tic-tac-toe fetch error
app.get('/:version/tic-tac-toe/fetch', (req, res) => {
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

    const getTimeFormats = (date, timezoneOption) => {
        return {
            iso: date.toISOString(),
            utc: date.toUTCString(),
            timestamp: date.getTime(),
            locale: date.toLocaleString('en-US', { timeZone: timezoneOption, timeZoneName: 'long' }),
            date: date.toLocaleDateString('en-US', { timeZone: timezoneOption }),
            time: date.toLocaleTimeString('en-US', { timeZone: timezoneOption }),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            ms: date.getMilliseconds(),
            dayOfWeek: date.getDay(),
            dayOfYear: Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000),
            weekNumber: Math.ceil((((date - new Date(date.getFullYear(), 0, 0)) / 86400000) + 1) / 7),
            timezone: timezoneOption,
            timezoneOffset: date.getTimezoneOffset()
        };
    };

    if (type === 'random') {
        const startDate = new Date(start || '1900-01-01').getTime();
        const endDate = new Date(end || '2100-12-31').getTime();
        const randomDate = new Date(start ? startDate : startDate + Math.random() * (endDate - startDate));
        const timezoneOption = timezone || validTimezones[Math.floor(Math.random() * 5)];
        const formats = getTimeFormats(randomDate, timezoneOption);

        return res.jsonResponse(format && formats[format] ? { date: formats[format] } : formats);
    }

    const now = new Date();
    const timezoneOption = timezone || 'UTC';
    const formats = getTimeFormats(now, timezoneOption);

    res.jsonResponse(format && formats[format] ? { date: formats[format] } : formats);
});

// GET token error
app.get('/:version/token', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Generate username
app.get('/:version/username', (req, res) => {
    const adj = ['Happy', 'Silly', 'Clever', 'Creative', 'Brave', 'Gentle', 'Kind', 'Funny', 'Wise', 'Charming', 'Sincere', 'Resourceful', 'Patient', 'Energetic', 'Adventurous', 'Ambitious', 'Courageous', 'Courteous', 'Determined'];
    const ani = ['Cat', 'Dog', 'Tiger', 'Elephant', 'Monkey', 'Penguin', 'Dolphin', 'Lion', 'Bear', 'Fox', 'Owl', 'Giraffe', 'Zebra', 'Koala', 'Rabbit', 'Squirrel', 'Panda', 'Horse', 'Wolf', 'Eagle'];
    const job = ['Writer', 'Artist', 'Musician', 'Explorer', 'Scientist', 'Engineer', 'Athlete', 'Chef', 'Doctor', 'Teacher', 'Lawyer', 'Entrepreneur', 'Actor', 'Dancer', 'Photographer', 'Architect', 'Pilot', 'Designer', 'Journalist', 'Veterinarian'];

    const nombre = Math.floor(Math.random() * 100);
    const choix = {
        adj_num: () => random(adj) + nombre,
        ani_num: () => random(ani) + nombre,
        pro_num: () => random(job) + nombre,
        adj_ani: () => random(adj) + random(ani),
        adj_ani_num: () => random(adj) + random(ani) + nombre,
        adj_pro: () => random(adj) + random(job),
        pro_ani: () => random(job) + random(ani),
        pro_ani_num: () => random(job) + random(ani) + nombre
    };

    const username = choix[random(Object.keys(choix))]();
    res.jsonResponse({ adjective: adj, animal: ani, job, number: nombre, username });
});

// Display informations for owner's website
app.get('/:version/website', async (req, res) => {
    const currentTime = Date.now();

    if (currentTime - lastFetch >= 10 * 60 * 1000) {
        try {
            const username = '20syldev';
            const token = process.env.STATS5;
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
            gemsync: process.env.GEMSYNC,
            gitsite: process.env.GITSITE,
            logs: process.env.LOGS,
            logvault: process.env.LOGVAULT,
            minify: process.env.MINIFY,
            morpion: process.env.MORPION,
            nitrogen: process.env.NITROGEN,
            old_database: process.env.OLD_DATABASE,
            php: process.env.PHP,
            ping: process.env.PING,
            portfolio: process.env.PORTFOLIO,
            python_api: process.env.PYTHON_API,
            readme: process.env.README,
            terminal: process.env.TERMINAL,
            wrkit: process.env.WRKIT,
            zpki: process.env.ZPKI
        },
        patched_projects: process.env.PATCH !== undefined ? process.env.PATCH.split(' ') : [],
        updated_projects: process.env.RECENT !== undefined ? process.env.RECENT.split(' ') : [],
        new_projects: process.env.NEW !== undefined ? process.env.NEW.split(' ') : [],
        sub_domains: process.env.DOMAINS !== undefined ? process.env.DOMAINS.split(' ') : [],
        stats: {
            os: process.env.STATS1,
            front: process.env.STATS2,
            back: process.env.STATS3,
            projects: process.env.STATS4,
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
    const { username, message, timestamp, session, token } = req.body;

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!message) return res.jsonResponse({ error: 'Please provide a message (&message={message})' });
    if (!session) return res.jsonResponse({ error: 'Please provide a valid session ID (&session={ID})' });

    const u = username.toLowerCase(), now = Date.now();
    const msg = { username, message, timestamp: timestamp || new Date().toISOString() };

    rateLimits[u] = (rateLimits[u] || []).filter(ts => now - ts < 10000);
    if (rateLimits[u].length > 50) {
        const remainingTime = Math.ceil((rateLimits[u][0] + 10000 - now) / 1000);
        return res.jsonResponse({ error: `Rate limit exceeded. Try again in ${remainingTime} seconds.` });
    }
    rateLimits[u].push(now);

    if (sessions[u] && sessions[u].user !== session) return res.jsonResponse({ error: 'Session ID mismatch' });

    if (token) {
        privateChats[token] = privateChats[token] || [];
        privateChats[token].push(msg);
        setTimeout(() => { delete privateChats[token]; }, 3600000);
    } else {
        chat.push(msg);
        setTimeout(() => chat.splice(chat.indexOf(msg), 1), 3600000);
    }

    sessions[u] = sessions[u] || { user: session, last: now };
    sessions[u].last = now;

    setTimeout(() => { if (now - sessions[u].last >= 3600000) delete sessions[u]; }, 3600000);

    res.jsonResponse({ message: 'Message sent successfully' });
});

// Display a private chat with a token
app.post('/:version/chat/private', (req, res) => {
    const { username, token } = req.body;

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!token) return res.jsonResponse({ error: 'Please provide a valid token (&token={key}).' });

    const u = username.toLowerCase(), now = Date.now();

    rateLimits[u] = (rateLimits[u] || []).filter(ts => now - ts < 10000);
    if (rateLimits[u].length > 50) {
        const remainingTime = Math.ceil((rateLimits[u][0] + 10000 - now) / 1000);
        return res.jsonResponse({ error: `Rate limit exceeded. Try again in ${remainingTime} seconds.` });
    }
    rateLimits[u].push(now);

    if (privateChats[token]) return res.jsonResponse(privateChats[token]);

    return res.jsonResponse({ error: 'Invalid or expired token.' });
});

// Generate hash
app.post('/:version/hash', (req, res) => {
    const { text, method } = req.body;
    const { version } = req.params;

    if (!text) return res.jsonResponse({ error: 'Please provide a text (?text={text})' });
    if (!method) return res.jsonResponse({
        error: 'Please provide a valid hash algorithm (?method={algorithm})',
        documentation: `https://docs.sylvain.pro/${version}/hash`
    });

    const methods = getHashes();
    if (!methods.includes(method)) return res.jsonResponse({ error: `Unsupported method. Use one of: ${methods.join(', ')}` });

    const hash = createHash(method).update(text).digest('hex');
    res.jsonResponse({ method, hash });
});

// Display a planning from an ICS file
app.post('/:version/hyperplanning', async (req, res) => {
    const { url, detail } = req.body;

    if (!url) return res.jsonResponse({ error: 'Please provide a valid ICS file URL.' });

    try {
        const response = await fetch(url);
        if (!response.ok || !(response.headers.get('content-type') || '').includes('text/calendar')) return res.jsonResponse({ error: 'Invalid ICS file format.' });

        const events = new ical.Component(ical.parse(await response.text()))
            .getAllSubcomponents('vevent')
            .map(e => {
                const evt = new ical.Event(e);
                const summary = evt.summary.split(' ').filter(part => part !== '-');
                const start = formatDate(evt.startDate.toJSDate());
                const end = formatDate(evt.endDate.toJSDate());

                if (detail === 'full') {
                    const desc = evt.description.split('\n').map(l => l.trim());
                    const extract = (p) => (desc.find(l => l.startsWith(p)) || '').replace(p, '').trim();

                    return {
                        summary,
                        subject: extract('Matière :'),
                        teacher: extract('Enseignant :'),
                        classes: extract('Promotions :').split(', ').map(c => c.trim()),
                        type: extract('Salle :') || undefined,
                        start,
                        end
                    };
                }
                if (detail === 'list') return { summary, start, end };

                return { summary: evt.summary, start, end };
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .filter(e => new Date(e.end) >= new Date());

        res.jsonResponse(events);
    } catch { res.jsonResponse({ error: 'Failed to parse ICS file.' }); }
});

// Store tic tac toe games
app.post('/:version/tic-tac-toe', (req, res) => {
    const { username, move, session, game } = req.body;

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });
    if (!move) return res.jsonResponse({ error: 'Please provide a valid move (&move={move})' });
    if (!session) return res.jsonResponse({ error: 'Please provide a valid session ID (&session={ID})' });
    if (!game) return res.jsonResponse({ error: 'Please provide a valid game ID (&game={ID})' });

    const u = username.toLowerCase(), now = Date.now();
    const play = { username, move, session };
    const validMoves = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3'];

    if (!validMoves.includes(move)) return res.jsonResponse({ error: 'Invalid move. Please provide a valid move (e.g., 1-1, 2-2, 3-3).' });

    rateLimits[u] = (rateLimits[u] || []).filter(ts => now - ts < 10000);
    if (rateLimits[u].length > 50) {
        const remainingTime = Math.ceil((rateLimits[u][0] + 10000 - now) / 1000);
        return res.jsonResponse({ error: `Rate limit exceeded. Try again in ${remainingTime} seconds.` });
    }
    rateLimits[u].push(now);

    if (sessions[u] && sessions[u].user !== session) return res.jsonResponse({ error: 'Session ID mismatch' });

    games[game] = games[game] || [];

    const players = [...new Set(games[game].map(play => play.username))];
    if (players.length >= 2 && !players.includes(username)) return res.jsonResponse({ error: 'Game is full, you can only watch.' });
    if (games[game].length > 0 && games[game][games[game].length - 1].username === username) return res.jsonResponse({ error: 'Please wait for the other player to make a move.' });
    if (games[game].some(play => play.move === move)) return res.jsonResponse({ error: 'Move already made. Please choose a different move.' });

    games[game].push(play);

    const result = checkGame(games[game]);
    if (result.winner || result.tie) {
        setTimeout(() => delete games[game], 600000);
        return res.jsonResponse({
            message: `Move sent successfully. ${result.winner ? result.winner + ' wins. ' + result.loser + ' loses.' : 'It\'s a tie.'}`,
            ...result
        });
    }
    if (!result.winner && !result.tie) setTimeout(() => delete games[game], 3600000);

    sessions[u] = sessions[u] || { user: session, last: now };
    sessions[u].last = now;

    setTimeout(() => { if (now - sessions[u].last >= 3600000) delete sessions[u]; }, 3600000);

    res.jsonResponse({ message: 'Move sent successfully' });
});

// Display a tic tac toe game with a token
app.post('/:version/tic-tac-toe/fetch', (req, res) => {
    const { username, game } = req.body;

    if (!username) return res.jsonResponse({ error: 'Please provide a username (?username={username})' });

    const ID = game || genID();
    const u = username.toLowerCase(), now = Date.now();

    rateLimits[u] = (rateLimits[u] || []).filter(ts => now - ts < 10000);
    if (rateLimits[u].length > 50) {
        const remainingTime = Math.ceil((rateLimits[u][0] + 10000 - now) / 1000);
        return res.jsonResponse({ error: `Rate limit exceeded. Try again in ${remainingTime} seconds.` });
    }
    rateLimits[u].push(now);

    if (!games[ID]) games[ID] = [];

    const data = games[ID];
    const last = data.length ? data[data.length - 1].username : null;
    const players = [...new Set(data.map(p => p.username))];
    const turn = players.find(p => p !== last);
    const result = data.length ? checkGame(data) : {};

    res.jsonResponse({ game: data, turn, ID, ...result });
});

// Generate Token
app.post('/:version/token', (req, res) => {
    let { len, type } = req.body;

    len = parseInt(len || 24, 10);
    type = type ? type.toLowerCase() : 'alpha';

    if (isNaN(len) || len < 0) return res.jsonResponse({ error: 'Invalid number.' });
    if (len > 4096) return res.jsonResponse({ error: 'Length cannot exceed 4096.' });
    if (len < 12) return res.jsonResponse({ error: 'Length cannot be less than 12.' });

    const token = {
        alpha: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', len),
        alphanum: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len),
        base64: randomBytes(len).toString('base64').slice(0, len),
        hex: randomBytes(len).toString('hex').slice(0, len),
        num: genToken('0123456789', len),
        punct: genToken('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', len),
        urlsafe: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', len),
        uuid: v4().replace(/-/g, '').slice(0, len)
    }[type] || genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len);

    res.jsonResponse({ token });
});

// ----------- ----------- SERVER SETUP ----------- ----------- //

app.listen(3000, () => console.log('API is running on\n    - http://127.0.0.1:3000\n    - http://localhost:3000'));
