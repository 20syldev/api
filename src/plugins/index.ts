import { type Router } from 'express';

import website from './website.js';

const plugins: Router[] = [website];

export default plugins;
