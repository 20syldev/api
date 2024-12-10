require('dotenv').config();

// Built-in module
const crypto = require('crypto');

// Imported module
const { createCanvas } = require('canvas');
const cors = require('cors');
const express = require('express');
const math = require('mathjs');
const qrcode = require('qrcode');
const random = require('random');
const uuid = require('uuid');
const app = express();

// Define allowed versions & endpoints
const versions = ['v1'];
const endpoints = ['algorithms', 'captcha', 'color', 'domain', 'infos', 'personal', 'qrcode', 'token', 'username'];


// ----------- ----------- MIDDLEWARES SETUP ----------- ----------- //

// CORS & Express setup
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(express.urlencoded({ extended: true }));

// Return formatted JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.jsonResponse = (data) => {
        res.send(JSON.stringify(data, null, 2));
    };
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
    if (!['anagram', 'factorial', 'fibonacci', 'palindrome', 'reverse'].includes(tool)) return res.jsonResponse({ error: 'Invalid algorithm.' });
    if (!value) return res.jsonResponse({ error: 'Please provide a value.' });

    if (tool === 'anagram') {
        if (!value2) return res.jsonResponse({ error: 'Please provide a second input.' });
        return res.jsonResponse({ answer: value.split('').sort().join('') === value2.split('').sort().join('') });
    }

    if (tool === 'factorial') {
        if (isNaN(value) || value < 0 || value > 170) return res.jsonResponse({ error: 'Please provide a valid number between 0 and 170.' });
        return res.jsonResponse({ answer: math.factorial(value) });
    }
    }

    if (tool === 'fibonacci') {
        let fib = [0, 1];
        for (let i = 2; i < parseInt(value); i++) fib.push(fib[i - 1] + fib[i - 2]);
        return res.jsonResponse({ answer: fib.slice(0, parseInt(value)) });
    }

    if (tool === 'palindrome') return res.jsonResponse({ answer: value === value.split('').reverse().join('') });

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

    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
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

    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = 'black';
        ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), 1, 1);
    }

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
});

// Generate color
app.get('/:version/color', (req, res) => {
    const r = random.int(0, 255), g = random.int(0, 255), b = random.int(0, 255);
    res.jsonResponse({ 
        hex: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
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

    const user = data[Math.floor(Math.random() * data.length)];
    const localisation = localisations[Math.floor(Math.random() * localisations.length)];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const card = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9000) + 1000).join(' ');
    const cvc = Math.floor(Math.random() * 900) + 100;
    const expirationDate = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${(new Date().getFullYear() + Math.floor(Math.random() * 3)).toString().slice(-2)}`;

    res.jsonResponse({ ...user, ...localisation, job, card, cvc, expiration: expirationDate });
});

// Generate QR Code
app.get('/:version/qrcode', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.jsonResponse({ error: 'Please provide a valid url (?url={URL})' });

    try {
        const qr = await qrcode.toDataURL(url);
        res.jsonResponse({ qr });
    } catch (err) {
        res.jsonResponse({ error: 'Error generating QR code.' });
    }
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

    const choix = ['adj_num', 'ani_num', 'pro_num', 'adj_ani', 'adj_ani_num', 'adj_pro', 'pro_ani', 'pro_ani_num'][Math.floor(Math.random() * 8)];
    const nombre = Math.floor(Math.random() * 100).toString();
    let username = '';

    switch (choix) {
        case 'adj_num':
            username = adj[Math.floor(Math.random() * adj.length)] + nombre;
            break;
        case 'ani_num':
            username = ani[Math.floor(Math.random() * ani.length)] + nombre;
            break;
        case 'pro_num':
            username = job[Math.floor(Math.random() * job.length)] + nombre;
            break;
        case 'adj_ani':
            username = adj[Math.floor(Math.random() * adj.length)] + ani[Math.floor(Math.random() * ani.length)];
            break;
        case 'adj_ani_num':
            username = adj[Math.floor(Math.random() * adj.length)] + ani[Math.floor(Math.random() * ani.length)] + nombre;
            break;
        case 'adj_pro':
            username = adj[Math.floor(Math.random() * adj.length)] + job[Math.floor(Math.random() * job.length)];
            break;
        case 'pro_ani':
            username = job[Math.floor(Math.random() * job.length)] + ani[Math.floor(Math.random() * ani.length)];
            break;
        case 'pro_ani_num':
            username = job[Math.floor(Math.random() * job.length)] + ani[Math.floor(Math.random() * ani.length)] + nombre;
            break;
    }

    const response = {
        adjective: adj,
        animal: ani,
        job: job,
        number: nombre,
        username: username
    };

    res.status(200).jsonResponse(response);
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

app.listen(3000, () => console.log('Server running on port 3000'));
