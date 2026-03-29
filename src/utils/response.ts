import type { Response } from 'express';
import { DOCS_URL, STATUS_MESSAGES } from '../constants.js';

export function error(res: Response, status: number, message: string, docPath?: string): void {
    res.status(status).jsonResponse({
        message: STATUS_MESSAGES[status] ?? 'Error',
        error: message,
        documentation: docPath ? `${DOCS_URL}/${docPath}` : DOCS_URL,
        status: String(status),
    });
}
