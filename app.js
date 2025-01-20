require('dotenv').config();

// Built-in module
const crypto = require('crypto');

// Imported module
const { createCanvas } = require('canvas');
const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const math = require('mathjs');
const path = require('path');
const qrcode = require('qrcode');
const random = require('random');
const uuid = require('uuid');
const app = express();

// Define allowed versions & endpoints
const versions = ['v1'];
const endpoints = ['algorithms', 'captcha', 'color', 'convert', 'chat', 'domain', 'hash', 'infos', 'personal', 'qrcode', 'token', 'username', 'website'];

// Store logs
const logs = [], chat = [];

// Define global variables
let lastFetch = 0; commits = 0; requests = 0, resetTime = Date.now() + 10000;

// Reset chat every 10 minutes
setInterval(() => chat.shift(), 600000);

// ----------- ----------- MIDDLEWARES SETUP ----------- ----------- //

// CORS & Express setup
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set favicon for API
app.use('/favicon.ico', express.static(path.join(__dirname, 'src', 'favicon.ico')));

// Display robots.txt
app.use('/robots.txt', express.static(path.join(__dirname, 'robots.txt')));

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
    res.status(500).json({
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
            documentation: 'https://docs.sylvain.pro',
            status: '404'
        });
    }
    next();
});

// Check if endpoint exists
app.use('/:version/:endpoint', (req, res, next) => {
    const { version, endpoint } = req.params;

    if (!versions.includes(version) || !endpoints.includes(endpoint)) {
        return res.status(404).jsonResponse({
            message: 'Not Found',
            error: `Endpoint '${endpoint}' does not exist in ${version}.`,
            documentation: 'https://docs.sylvain.pro',
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
            v1: 'https://api.sylvain.pro/v1'
        }
    });
});

// Display v1 endpoints
app.get('/v1', (req, res) => {
    res.jsonResponse({
        version: 'v1',
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
                hash: '/v1/hash',
                token: '/v1/token'
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

    if (!['anagram', 'bubblesort', 'factorial', 'fibonacci', 'gcd', 'isprime', 'palindrome', 'primefactors', 'primelist', 'reverse'].includes(method)) {
        return res.jsonResponse({
            error: 'Please provide a valid algorithm (?method={algorithm})',
            documentation: 'https://docs.sylvain.pro/v1/algorithms'
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
        return res.jsonResponse({ answer: math.factorial(value) });
    }

    if (method === 'fibonacci') {
        let fib = [0, 1];
        for (let i = 2; i < parseInt(value); i++) fib.push(fib[i - 1] + fib[i - 2]);
        return res.jsonResponse({ answer: fib.slice(0, parseInt(value)) });
    }

    if (method === 'gcd') {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
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

// Generate color
app.get('/:version/color', (req, res) => {
    const r = random.int(0, 255), g = random.int(0, 255), b = random.int(0, 255);
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
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const subdomains = ['fr.', 'en.', 'docs.', 'api.', 'projects.', 'app.', 'web.', 'info.', 'dev.', 'shop.', 'blog.', 'support.', 'mail.', 'forum.'];
    const domains = ['example', 'site', 'test', 'demo', 'page', 'store', 'portfolio', 'platform', 'hub', 'network', 'service', 'cloud', 'solutions', 'company'];
    const tlds = ['.com', '.fr', '.eu', '.dev', '.net', '.org', '.io', '.tech', '.biz', '.info', '.co', '.app', '.store', '.online', '.shop', '.tv'];

    const domain = `${random(domains)}${random(tlds)}`;
    const fulldomain = `${random(subdomains)}${domain}`;
    
    const getRandomIp = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const ips = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, getRandomIp);
    const dns = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, getRandomIp);

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

// GET hash error
app.get('/:version/hash', (req, res) => {
    res.jsonResponse({ error: 'This endpoint only supports POST requests.' });
});

// Display API informations
app.get('/:version/infos', (req, res) => {
    res.jsonResponse({
        endpoints: endpoints.length - 1,
        last_version: versions.at(-1),
        documentation: 'https://docs.sylvain.pro',
        github: 'https://github.com/20syldev/api',
        creation: 'November 25th 2024',
    });
});

// Display stored data
app.get('/:version/chat', (req, res) => {
    if (chat.length > 0) res.jsonResponse(chat);
    else res.jsonResponse({ error: 'No messages stored.' });
});

// Generate personal data
app.get('/:version/personal', (req, res) => {
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
            coop_api: process.env.COOP_API,
            coop_status: process.env.COOP_STATUS,
            digit: process.env.DIGIT,
            doc_coopbot: process.env.DOC_COOPBOT,
            docs: process.env.DOCS,
            donut: process.env.DONUT,
            flowers: process.env.FLOWERS,
            gemsync: process.env.GEMSYNC,
            gitsite: process.env.GITSITE,
            logs: process.env.LOGS,
            nitrogen: process.env.NITROGEN,
            old_database: process.env.OLD_DATABASE,
            portfolio: process.env.PORTFOLIO,
            python_api: process.env.PYTHON_API,
            readme: process.env.README,
            terminal: process.env.TERMINAL,
            wrkit: process.env.WRKIT,
        },
        updated_projects: process.env.RECENT.split(' '),
        new_projects: process.env.NEW.split(' '),
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

// Generate hash
app.post('/:version/hash', (req, res) => {
    const { text, method } = req.body;

    if (!text) return res.jsonResponse({ error: 'Please provide a text (?text={text})' });
    if (!method) return res.jsonResponse({
        error: 'Please provide a valid hash algorithm (?method={algorithm})',
        documentation: 'https://docs.sylvain.pro/v1/hash'
    });

    const methods = crypto.getHashes();
    if (!methods.includes(method)) return res.jsonResponse({ error: `Unsupported method. Use one of: ${methods.join(', ')}` });

    const hash = crypto.createHash(method).update(text).digest('hex');
    res.jsonResponse({ method, hash });
});

// Store chat messages
app.post('/:version/chat', (req, res) => {
    const { username, message, timestamp } = req.body;
    
    if (!username || !message) return res.status(400).jsonResponse({ error: 'Username and message are required.' });
    chat.push({ username, message, timestamp: timestamp || new Date().toISOString() });
    res.jsonResponse({ message: 'Message sent successfully' });
});

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
