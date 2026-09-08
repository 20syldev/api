# @20syldev/api

## About

`@20syldev/api` bundles 42 self-contained utilities: encryption, matrix math, SVG charts, CSV, JWT, TOTP, barcodes, fake data generation, text processing, validation and more. Install it and import — no configuration, no setup step, types included.

It works two ways:

- **As a library** — import any module directly into your code.
- **As a server** — a single import boots an Express app that exposes every module over HTTP.

The HTTP surface is versioned from `v1` to `v5`, and every version stays mounted side by side, so a new release never changes the behaviour of the one you already target. The full endpoint reference lives on [docs.sylvain.sh](https://docs.sylvain.sh).

## Requirements

**Node.js >= 22.12.0.** The package ships as ESM, but that does not lock out CommonJS: Node has been able to `require()` an ESM module since 22.12, which is why that is the floor. The library entry works from both module systems.

```js
import { evaluate } from '@20syldev/api'; // ESM
const { evaluate } = require('@20syldev/api'); // CommonJS
```

The server entry loads its plugins asynchronously, so it must be imported rather than required:

```js
await import('@20syldev/api/server'); // from CommonJS
```

## Installation

```console
$ npm install @20syldev/api
```

## Quick start

The root import always resolves to the latest version. Use a subpath (`/v1` to `/v5`) to pin a specific one.

```js
// Latest version, equivalent to '@20syldev/api/v5'
import { color, evaluate, username } from '@20syldev/api';

// Or a specific version
import { color as colorV4 } from '@20syldev/api/v4';

// Evaluate a math expression
const expr = evaluate('sin(pi / 2) + sqrt(4)', 5);
console.log(expr.result); // 3
console.log(expr.expression); // 'sin(pi / 2) + sqrt(4)'

// Generate a random color, converted to every common notation
const c = color();
console.log(c.hex, c.rgb, c.hsl, c.hsv, c.hwb, c.cmyk);

// Generate a random username
const user = username();
console.log(user.username);
```

## What's inside

| Domain             | Exports                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Crypto**         | `asymmetric` `symmetric` `hash` `jwt` `otp` `token` `password` `captcha`              |
| **Math & data**    | **`matrix`** **`algorithms`** `evaluate` `statistics` `convert` `csv`                 |
| **Text**           | **`text`** **`encode`** **`validate`** `caseConvert` `levenshtein` `regex` `parseUrl` |
| **Graphics**       | **`chart`** `barcode` `qrcode` `avatar` `placeholder` `color` `palette`               |
| **Fake data**      | `personal` `address` `credit` `username` `dice` `domain` `agent`                      |
| **Network & time** | `ip` `geo` `time` `cron` `hyperplanning`                                              |
| **Stateful**       | `chat` `tic_tac_toe`                                                                  |

The six names in **bold** are namespaces — they group related functions, called as `namespace.method()`:

| Namespace        | Functions                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **`algorithms`** | `factorial` `fibonacci` `gcd` `isprime` `primefactors` `primelist` `roman` `anagram` `palindrome` `reverse` `bubblesort` |
| **`chart`**      | `bar` `line` `pie` `donut`                                                                                               |
| **`encode`**     | `base64encode` `base64decode` `urlencode` `urldecode` `binary` `unbinary` `morse` `unmorse` `caesar` `rot13`             |
| **`matrix`**     | `add` `subtract` `multiply` `scalar` `transpose` `determinant` `inverse` `identity`                                      |
| **`text`**       | `lorem` `slug` `stats` `number`                                                                                          |
| **`validate`**   | `email` `iban` `luhn`                                                                                                    |

Everything else is a plain function, called directly.

Two names differ from their HTTP endpoint, because `case` and `url` collide with reserved or global identifiers:

| Endpoint | Import        |
| -------- | ------------- |
| `/case`  | `caseConvert` |
| `/url`   | `parseUrl`    |

> _`personal` generates **fake** profiles (names, emails, jobs, addresses) for seeding and testing — it holds no real data._

## Examples

```js
import {
    asymmetric,
    caseConvert,
    chart,
    csv,
    evaluate,
    jwt,
    matrix,
    otp,
    parseUrl,
    symmetric,
    validate,
} from '@20syldev/api/v5';

// RSA key generation, encryption and decryption
const { publicKey, privateKey } = asymmetric('keygen', {});
const { result: encrypted } = asymmetric('encrypt', { text: 'secret message', publicKey });
const { result: decrypted } = asymmetric('decrypt', { text: encrypted, privateKey });
console.log(decrypted); // 'secret message'

// AES-256-GCM symmetric encryption, key derived with scrypt
const { result: blob } = symmetric('encrypt', 'secret message', 'a-strong-key');
const { result: plain } = symmetric('decrypt', blob, 'a-strong-key');
console.log(plain); // 'secret message'

// TOTP secret, code generation and verification
const { secret, uri } = otp('secret', { label: 'alice', issuer: 'MyApp' });
const { code } = otp('generate', { secret });
const { valid } = otp('verify', { secret, code });
console.log(valid); // true

// Decode a JWT without verifying its signature (inspection only)
const { header, payload } = jwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.qfhpVR4l');
console.log(header.alg, payload.sub); // 'HS256' '1234567890'

// Evaluate a math expression, with a precision
const { result } = evaluate('log2(8) * (3 + pi)', 4);
console.log(result); // 18.4248

// Matrix product
const { result: product } = matrix.multiply(
    [
        [1, 2],
        [3, 4],
    ],
    [
        [5, 6],
        [7, 8],
    ],
);
console.log(product); // [[19, 22], [43, 50]]

// Render an SVG chart in memory
const { body: svg } = chart.bar(
    { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'Sales', values: [120, 85, 200] }] },
    { width: 600, height: 300 },
);
// body holds a ready-to-serve SVG string

// Parse CSV into rows, or format rows back into CSV
const { rows } = csv('parse', { csv: 'name,age\nAlice,30\nBob,25' });
console.log(rows); // [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]

// Convert between case styles
console.log(caseConvert('hello world', 'pascal').result); // 'HelloWorld'

// Split a URL into its components
const parsed = parseUrl('https://example.com/a/b?tag=x&tag=y#top');
console.log(parsed.host, parsed.port, parsed.params, parsed.fragment);

// Validate an email, an IBAN or a card number
console.log(validate.email('alice@example.com').valid); // true
```

## Running the server

From the installed package, one import mounts every version:

```js
import '@20syldev/api/server';
```

From a clone of the repository:

```console
$ npm run build && npm start
```

```console
> @20syldev/api@5.9.0 build
> tsc

> @20syldev/api@5.9.0 start
> node dist/app.js

API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```

For development with automatic reloading:

```console
$ npm run dev
```

Endpoints follow the `/:version/:endpoint` pattern — `GET /v5/color`, `GET /v5/evaluate?expr=2%2B2`, `POST /v5/matrix`. `GET /` lists the available versions, and `GET /:version` lists that version's endpoints with their parameters.

### Configuration

Every setting is optional and read from the environment; a `.env` file at the project root is loaded automatically. The server runs with none of them set.

| Variable           | Default | Purpose                                                                                                                                                |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`             | `3000`  | Port the server listens on                                                                                                                             |
| `DOCS_URL`         | —       | Documentation base URL reported by `/`, `/:version` and `/:version/infos`                                                                              |
| `REPO_URL`         | —       | Source repository reported by `/:version/infos`                                                                                                        |
| `INSTANCE_CREATED` | —       | Launch date reported by `/:version/infos`                                                                                                              |
| `LOGS_TOKEN`       | —       | Value required in the `X-Logs-Token` header to read `/logs`; the route answers 404 while unset                                                         |
| `CHALLENGE_SECRET` | random  | Key signing the captcha and proof-of-work tokens; a random one is generated at startup while unset                                                     |
| `TRUSTED_PROXIES`  | one hop | CIDR blocks separated by spaces or commas, or the `loopback` / `linklocal` / `uniquelocal` shorthands, for deployments behind a CDN or platform router |
| `GLOBAL_LIMIT`     | `50000` | Requests per hour accepted across the whole instance                                                                                                   |
| `DEFAULT_LIMIT`    | `2000`  | Per-client requests per hour                                                                                                                           |
| `DEFAULT_BURST`    | `50`    | Per-client requests per 10-second window                                                                                                               |

The three metadata variables are omitted from responses when unset, so an instance never advertises somebody else's documentation or repository.

Higher quotas can be granted per client: `ADVANCED_`, `PRO_` and `BUSINESS_` variants of `_LIMIT` and `_BURST` define the tiers, and the matching `*_TOKEN_LIST` variables hold the space-separated bearer tokens that map to them. A client's tier and quota are reported by `GET /auth`.

> _Rate-limit counters live in process memory, so each instance of a multi-instance deployment counts separately._

> _Captcha and proof-of-work tokens are signed with `CHALLENGE_SECRET`. While it is unset each process invents its own key, so tokens stop verifying after a restart and are rejected by sibling instances — set it explicitly for any deployment running more than one process._

## Versioning

| Version | Adds                                                                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1`    | algorithms, captcha, color, convert, domain, personal, qrcode, username, token                                                                                                |
| `v2`    | chat, hash, tic-tac-toe                                                                                                                                                       |
| `v3`    | levenshtein, time, hyperplanning                                                                                                                                              |
| `v4`    | 24 endpoints — address, avatar, barcode, credit, cron, dice, encode, geo, ip, palette, password, placeholder, regex, statistics, text, validate… plus PATCH and DELETE routes |
| `v5`    | case, evaluate, url, asymmetric, chart, csv, jwt, matrix, otp, symmetric                                                                                                      |

`v4` and `v5` are fully typed. The package root always tracks the latest version.

> _`v1`, `v2` and `v3` share the same untyped JavaScript implementation and differ only by the endpoints they expose. They are **deprecated** and will be removed in `6.0.0` — new code should target `v5`._

## Scripts

| Command          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `npm run dev`    | Development server with automatic reloading (tsx watch) |
| `npm run build`  | Compile TypeScript to `dist/`                           |
| `npm start`      | Start the production server (`node dist/app.js`)        |
| `npm test`       | Run unit and integration tests                          |
| `npm run format` | Format with Prettier and auto-fix with ESLint           |
| `npm run check`  | TypeScript and ESLint verification                      |

## Hosted instance

A public instance runs at [api.sylvain.sh](https://api.sylvain.sh), with the complete endpoint reference, request examples and usage guides on [docs.sylvain.sh](https://docs.sylvain.sh).

## License

BSD 3-Clause. See [LICENSE](LICENSE).
