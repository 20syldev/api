import express from 'express';
import { env } from './config/env.js';
import { setupCors } from './middleware/cors.js';
import { jsonResponseMiddleware } from './middleware/json.js';
import { rateLimitMiddleware } from './middleware/ratelimit.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { versionCheckMiddleware, endpointCheckMiddleware } from './middleware/version.js';
import indexRoutes from './routes/index.js';
import getRoutes from './routes/get.js';
import postRoutes from './routes/post.js';

const app = express();

// Setup CORS, body parsing, static files
setupCors(app);

// Custom JSON response
app.use(jsonResponseMiddleware);

// Rate limiting
app.use(rateLimitMiddleware);

// Request logging
app.use(loggerMiddleware);

// Error handling
app.use(errorHandler);

// Root routes (before version check)
app.use(indexRoutes);

// Version & endpoint validation
app.use('/:version', versionCheckMiddleware);
app.use('/:version/:endpoint', endpointCheckMiddleware);

// Versioned routes
app.use(getRoutes);
app.use(postRoutes);

// Start server
app.listen(env.PORT, () =>
    console.log(`API is running on\n    - http://127.0.0.1:${env.PORT}\n    - http://localhost:${env.PORT}`),
);
