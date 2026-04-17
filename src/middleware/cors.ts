import cors from 'cors';
import express, { type Express } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupCors(app: Express): void {
    app.set('trust proxy', 1);
    app.use(cors({ methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    app.use(express.json({ limit: '10kb' }));

    app.use((_req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    });

    app.use('/favicon.ico', express.static(join(__dirname, '..', '..', 'src', 'favicon.ico')));
    app.use('/robots.txt', express.static(join(__dirname, '..', '..', 'robots.txt')));
}
