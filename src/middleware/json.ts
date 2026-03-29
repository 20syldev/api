import type { Request, Response, NextFunction } from 'express';

export function jsonResponseMiddleware(_req: Request, res: Response, next: NextFunction): void {
    res.setHeader('Content-Type', 'application/json');
    res.jsonResponse = (data: unknown) => {
        res.send(JSON.stringify(data, null, 2));
    };
    next();
}
