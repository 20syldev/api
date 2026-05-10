import type { NextFunction, Request, Response } from 'express';

import { error } from '../utils/response.js';

export function errorHandler(
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    console.error(err.stack);

    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    const sensitive = status === 500 && /\/[a-z]|\\[a-z]|ECONNREFUSED|ENOENT|EPERM|at\s+\w/i.test(err.message);
    error(res, status, sensitive ? 'An unexpected error occurred.' : err.message);
}
