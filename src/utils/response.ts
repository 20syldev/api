import type { Response } from 'express';

import { STATUS_MESSAGES } from '../constants.js';

/**
 * Sends a standardized JSON error response.
 *
 * @param res - Express response object
 * @param status - HTTP status code
 * @param message - Error description
 */
export function error(res: Response, status: number, message: string): void {
    const body = {
        message: STATUS_MESSAGES[status] ?? 'Error',
        error: message,
        status,
    };

    if (typeof res.jsonResponse === 'function') {
        res.status(status).jsonResponse(body);
    } else {
        res.status(status)
            .setHeader('Content-Type', 'application/json')
            .send(JSON.stringify(body, null, 2));
    }
}
