import type * as apiv3 from '../modules/v3.js';
import type * as apiv4 from '../modules/v4.js';

declare global {
    namespace Express {
        interface Request {
            version: string;
            latest: string;
            endpoint: string;
            module: typeof apiv3 | typeof apiv4;
        }

        interface Response {
            jsonResponse: (data: unknown) => void;
        }
    }
}
