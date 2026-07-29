import { type Router } from 'express';

import website from './website.js';

// Owner-only route plugins, mounted by app.ts on this deployment.
// Compiled to dist/plugins/, which is excluded from the npm package (.npmignore).
const plugins: Router[] = [website];

export default plugins;
