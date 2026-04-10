export const MAX_LOG_ENTRIES = 1000;
export const RATE_LIMIT_WINDOW = 10_000;
export const RATE_LIMIT_MAX = 50;
export const SESSION_TTL = 3_600_000;
export const GAME_CLEANUP_TTL = 600_000;
export const GITHUB_CACHE_TTL = 600_000;
export const MIN_TOKEN_LENGTH = 12;
export const MAX_TOKEN_LENGTH = 4096;
export const MAX_FACTORIAL = 170;
export const MAX_GCD_VALUE = 100_000;
export const MAX_PRIME_LIST = 10_000;
export const MAX_LEVENSHTEIN_LENGTH = 1000;
export const MAX_STRING_LENGTH = 1000;
export const MIN_TEMPERATURE = -273.15;
export const MAX_TEMPERATURE = 1_000_000;
export const DOCS_URL = 'https://docs.sylvain.sh';
export const DEFAULT_PORT = 3000;

export const STATUS_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
};

export const START_TIME = Date.now();

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
