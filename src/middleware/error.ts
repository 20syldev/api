import type { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error(err.stack);
    error(res, 500, err.message);
}
