import pkg from '../package.json' with { type: 'json' };

// App
export const APP_VERSION = pkg.version;
export const DEFAULT_PORT = 3000;
export const DOCS_URL = 'https://docs.sylvain.sh';
export const START_TIME = Date.now();

// Server
export const GAME_CLEANUP_TTL = 600_000;
export const GITHUB_CACHE_TTL = 600_000;
export const MAX_LOG_ENTRIES = 1000;
export const RATE_LIMIT_WINDOW = 10_000;
export const RATE_LIMIT_MAX = 50;
export const SESSION_TTL = 3_600_000;

export const STATUS_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    405: 'Method Not Allowed',
    413: 'Payload Too Large',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
};

// Modules
export const EARTH_RADIUS_KM = 6371;
export const MAX_ADDRESS_COUNT = 10;
export const MAX_CHART_DATASETS = 5;
export const MAX_CHART_LABELS = 20;
export const MAX_CREDIT_COUNT = 10;
export const MAX_COUNTDOWN_YEARS = 100;
export const MAX_CRON_ITERATIONS = 365 * 24 * 60;
export const MAX_CRON_RESULTS = 20;
export const MAX_EXPR_DEPTH = 100;
export const MAX_EXPR_LENGTH = 500;
export const MAX_FACTORIAL = 170;
export const MAX_GCD_VALUE = 100_000;
export const MAX_LEVENSHTEIN_LENGTH = 1000;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_PASSWORD_COUNT = 20;
export const MAX_MATRIX_SIZE = 20;
export const MAX_PATTERN_LENGTH = 200;
export const MAX_PRIME_LIST = 10_000;
export const MAX_QRCODE_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_REGEX_MATCHES = 100;
export const MAX_RSA_MODULUS = 4096;
export const MAX_STRING_LENGTH = 1000;
export const MIN_TOKEN_LENGTH = 12;
export const MAX_TOKEN_LENGTH = 4096;

export const ROMAN_VALUES: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
];
