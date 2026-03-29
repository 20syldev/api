import type { Request, Response, NextFunction } from 'express';
import { versions } from '../config/versions.js';
import { error } from '../utils/response.js';

export function versionCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
    const version = req.params.version as string;
    const latest = Object.keys(versions).pop()!;

    req.version = version;
    req.latest = latest;

    if (!versions[version]) {
        error(res, 404, `Invalid API version (${version}).`, latest);
        return;
    }

    req.module = versions[version]!.modules;

    if (!req.module) {
        error(res, 404, `Module not found for version ${version}.`, latest);
        return;
    }

    next();
}

export function endpointCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
    const version = req.params.version as string;
    const endpoint = req.params.endpoint as string;

    req.version = version;
    req.endpoint = endpoint;

    if (!endpoint) {
        error(res, 404, `Endpoint '${endpoint}' does not exist in ${req.version}.`);
        return;
    }
    next();
}
