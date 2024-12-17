// Built-in module
const crypto = require('crypto');

// Imported module
const { createCanvas } = require('canvas');
const cors = require('cors');
const express = require('express');
const math = require('mathjs');
const path = require('path');
const qrcode = require('qrcode');
const random = require('random');
const uuid = require('uuid');
const app = express();

// Define allowed versions & endpoints
const versions = ['v1'];
const endpoints = ['algorithms', 'captcha', 'color', 'domain', 'infos', 'personal', 'qrcode', 'token', 'username'];

// Define global variables
let requests = 0, resetTime = Date.now() + 10000;

// ----------- ----------- MIDDLEWARES SETUP ----------- ----------- //

// CORS & Express setup
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(express.urlencoded({ extended: true }));

// Set favicon for API
app.use('/favicon.ico', express.static(path.join(__dirname, 'src', 'favicon.ico')));

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
    if (++requests > 1000) return res.status(429).jsonResponse({ message: "Too Many Requests" });
    next();
});

// Logs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Internal Server Error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
        documentation_url: "https://docs.sylvain.pro",
        status: '500'
    });
});

// Check if version exists
app.use('/:version', (req, res, next) => {
    const { version } = req.params;

    if (!versions.includes(version)) {
        return res.status(404).jsonResponse({
            message: "Not Found",
            error: `Invalid API version (${version}).`,
            documentation_url: "https://docs.sylvain.pro",
            status: '404'
        });
    }
    next();
});

// Check if endpoint exists
app.use('/:version/:endpoint', (req, res, next) => {
    const { version, endpoint } = req.params;

    if (!endpoints.includes(endpoint)) {
        return res.status(404).jsonResponse({
            message: "Not Found",
            error: `Endpoint '${endpoint}' does not exists in ${version}.`,
            documentation_url: "https://docs.sylvain.pro",
            status: '404'
        });
    }
    next();
});

// ----------- ----------- MAIN & VERSION ENDPOINTS ----------- ----------- //

// Main route
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.jsonResponse({ 
        versions: { 
            v1: 'https://api.sylvain.pro/v1'
        }
    });
});

// Display v1 endpoints
app.get('/v1', async (req, res) => {
    res.jsonResponse({
        version: 'v1',
        endpoints: {
            algorithm: '/v1/algorithms?tool={algorithm}&value={value}(&value2={value2})',
            captcha: '/v1/captcha?text={text}',
            color: '/v1/color',
            domain: '/v1/domain',
            infos: '/v1/infos',
            personal: '/v1/personal',
            qrcode: '/v1/qrcode?url={URL}',
            token: '/v1/token(?len={length}&type={type})',
            username: '/v1/username'
        }
    });
});

// ----------- ----------- GET ENDPOINTS ----------- ----------- //

// Algorithms tool
app.get('/:version/algorithms', (req, res) => {
    const { tool, value, value2 } = req.query;
    if (!['anagram', 'bubblesort', 'factorial', 'fibonacci', 'gcd', 'isprime', 'palindrome', 'primefactors', 'primelist', 'reverse'].includes(tool) || !value) 
        return res.jsonResponse({ error: 'Invalid or missing input.' });

    if (tool === 'anagram') {
        if (!value2) return res.jsonResponse({ error: 'Please provide a second input.' });
        return res.jsonResponse({ answer: value.split('').sort().join('') === value2.split('').sort().join('') });
    }

    if (tool === 'bubblesort') {
        const arr = value.split(',').map(Number);
        const n = arr.length;
        for (let i = 0; i < n-1; i++) {
            for (let j = 0; j < n-i-1; j++) {
                if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; 
            }
        }
        return res.jsonResponse({ answer: arr });
    }

    if (tool === 'factorial') {
        if (isNaN(value) || value < 0 || value > 170) return res.jsonResponse({ error: 'Please provide a valid number between 0 and 170.' });
        return res.jsonResponse({ answer: math.factorial(value) });
    }

    if (tool === 'gcd') {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        if (!value2) return res.jsonResponse({ error: 'Please provide a second input.' });
        if (isNaN(value) || isNaN(value2)) return res.jsonResponse({ error: 'Invalid numbers.' });
        return res.jsonResponse({ answer: gcd(value, value2) });
    }

    if (tool === 'isprime') {
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

    if (tool === 'fibonacci') {
        let fib = [0, 1];
        for (let i = 2; i < parseInt(value); i++) fib.push(fib[i - 1] + fib[i - 2]);
        return res.jsonResponse({ answer: fib.slice(0, parseInt(value)) });
    }

    if (tool === 'palindrome') return res.jsonResponse({ answer: value === value.split('').reverse().join('') });

    if (tool === 'primelist') {
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

    if (tool === 'primefactors') {
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

    if (tool === 'reverse') return res.jsonResponse({ answer: value.split('').reverse().join('') });
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

// Generate color
app.get('/:version/color', (req, res) => {
    const r = random.int(0, 255), g = random.int(0, 255), b = random.int(0, 255);
    const cmyk = (() => {
        const k = 1 - Math.max(r, g, b) / 255, c = (1 - r / 255 - k) / (1 - k) || 0, m = (1 - g / 255 - k) / (1 - k) || 0, y = (1 - b / 255 - k) / (1 - k) || 0;
        return [c, m, y, k].map(x => x * 100);
    })();
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
    res.jsonResponse({
        cmyk: `cmyk(${cmyk.map(x => x.toFixed(1)).join('%, ')}%)`,
        hex: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
        hsl: `hsl(${hsl[0].toFixed(1)}, ${hsl[1].toFixed(1)}%, ${hsl[2].toFixed(1)}%)`,
        hsv: `hsv(${hsv[0].toFixed(1)}, ${hsv[1].toFixed(1)}%, ${hsv[2].toFixed(1)}%)`,
        hwb: `hwb(${hwb[0].toFixed(1)}, ${hwb[1].toFixed(1)}%, ${hwb[2].toFixed(1)}%)`,
        rgb: `rgb(${r}, ${g}, ${b})`
    });
});

// Generate domain informations
app.get('/:version/domain', (req, res) => {
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const subdomains = ['fr.', 'en.', 'docs.', 'api.', 'projects.', 'app.', 'web.', 'info.', 'dev.'];
    const domainNames = ['example', 'site', 'test', 'demo', 'page'];
    const tlds = ['.com', '.fr', '.eu', '.dev', '.net', '.org', '.io', '.tech', '.biz', '.info', '.co', '.app'];

    const randomSubdomain = random(subdomains);
    const randomDomainName = random(domainNames);
    const randomTld = random(tlds);

    const fullDomain = `${randomDomainName}${randomTld}`;
    const fullSubdomainDomain = `${randomSubdomain}${randomDomainName}${randomTld}`;

    res.jsonResponse({
        domain: fullDomain,
        subdomain_domain: fullSubdomainDomain,
        random_subdomain: randomSubdomain,
        random_name: randomDomainName,
        random_tld: randomTld
    });
});

// Display API informations
app.get('/:version/infos', async (req, res) => {
    res.jsonResponse({
        endpoints: endpoints.length,
        last_version: versions.at(-1),
        documentation: "https://docs.sylvain.pro",
        github: "https://github.com/20syldev/api",
        creation: "November 25th 2024",
    });
});

// Generate personal data
app.get('/:version/personal', (req, res) => {
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const data = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Martin', email: 'jane@example.com' },
        { name: 'Michael Johnson', email: 'michael@example.com' },
        { name: 'Emily Davis', email: 'emily@example.com' },
        { name: 'Alexis Barbos', email: 'alexis@example.com' }
    ];
    const localisations = [
        { localisation: 'US', tel: '123-456-7890' },
        { localisation: 'FR', tel: '06 78 90 12 34' },
        { localisation: 'UK', tel: '7911 123456' },
        { localisation: 'ES', tel: '678 901 234' },
        { localisation: 'DE', tel: '163 555 1584' }
    ];
    const jobs = ['Writer', 'Artist', 'Musician', 'Explorer', 'Scientist', 'Engineer', 'Athlete', 'Doctor'];

    const card = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9000) + 1000).join(' ');
    const cvc = Math.floor(Math.random() * 900) + 100;
    const expiration = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${(new Date().getFullYear() + Math.floor(Math.random() * 3)).toString().slice(-2)}`;

    res.jsonResponse({ ...random(data), ...random(localisations), job: random(jobs), card, cvc, expiration });
});

// Generate QR Code
app.get('/:version/qrcode', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.jsonResponse({ error: 'Please provide a valid url (?url={URL})' });

    try { res.jsonResponse({ qr: await qrcode.toDataURL(url) }); }
    catch { res.jsonResponse({ error: 'Error generating QR code.' }); }
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

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
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

// ----------- ----------- POST ENDPOINTS ----------- ----------- //

// Generate Token
app.post('/:version/token', (req, res) => {
    const length = parseInt(req.body.len || 24, 10);
    const type = req.body.type || 'alpha';

    if (isNaN(length) || length < 0) return res.jsonResponse({ error: 'Invalid number.' });
    if (length > 4096) return res.jsonResponse({ error: 'Length cannot exceed 4096.' });
    if (length < 12) return res.jsonResponse({ error: 'Length cannot be less than 12.' });

    const generateToken = (chars) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const token = {
        alpha: generateToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        alphanum: generateToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
        base64: crypto.randomBytes(length).toString('base64').slice(0, length),
        hex: crypto.randomBytes(length).toString('hex').slice(0, length),
        num: generateToken('0123456789'),
        punct: generateToken('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'),
        urlsafe: generateToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
        uuid: uuid.v4().replace(/-/g, '').slice(0, length)
    }[type] || generateToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

    res.jsonResponse({ token });
});

// ----------- ----------- SERVER SETUP ----------- ----------- //

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
