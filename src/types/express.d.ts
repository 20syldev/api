import type * as apiv4 from '../modules/v4.js';
import type * as apiv5 from '../modules/v5.js';
import type * as apiv6 from '../modules/v6.js';

declare global {
    namespace Express {
        interface Request {
            version: string;
            latest: string;
            endpoint: string;
            module: typeof apiv4 | typeof apiv5 | typeof apiv6;
        }

        interface Response {
            jsonResponse: (data: unknown) => void;
        }
    }
}
