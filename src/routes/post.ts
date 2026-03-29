import { Router, type Request, type Response } from 'express';
import { chatStorage, ticTacToeStorage } from '../storage/index.js';
import { MIN_TOKEN_LENGTH, MAX_TOKEN_LENGTH } from '../constants.js';
import { error } from '../utils/response.js';

const router = Router();

// Store chat messages
router.post('/:version/chat', (req: Request, res: Response) => {
    const { username, message, timestamp, session, token } = (req.body as Record<string, string>) || {};

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }
    if (!message) {
        error(res, 400, 'Please provide a message (&message={message})');
        return;
    }
    if (!session) {
        error(res, 400, 'Please provide a valid session ID (&session={ID})');
        return;
    }

    try {
        const result = req.module.chat('message', {
            username,
            message,
            timestamp,
            session,
            token,
            storage: chatStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// Display a private chat with a token
router.post('/:version/chat/private', (req: Request, res: Response) => {
    const { username, token } = (req.body as Record<string, string>) || {};

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }
    if (!token) {
        error(res, 400, 'Please provide a valid token (&token={key}).');
        return;
    }

    try {
        const messages = req.module.chat('private', {
            username,
            token,
            storage: chatStorage,
        });
        res.jsonResponse(messages);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// Generate hash
router.post('/:version/hash', (req: Request, res: Response) => {
    const { text, method } = (req.body as Record<string, string>) || {};

    if (!text) {
        error(res, 400, 'Please provide a text (?text={text})', `${req.version}/hash`);
        return;
    }
    if (!method) {
        error(res, 400, 'Please provide a valid hash algorithm (&method={algorithm})', `${req.version}/hash`);
        return;
    }

    try {
        const result = req.module.hash(text, method);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/hash`);
    }
});

// Display a planning from an ICS file
router.post('/:version/hyperplanning', async (req: Request, res: Response) => {
    const { url, detail } = (req.body as Record<string, string>) || {};

    if (!url) {
        error(res, 400, 'Please provide a valid ICS file URL (?url={URL})', `${req.version}/hyperplanning`);
        return;
    }

    try {
        const hyperplanning = await req.module.hyperplanning(url, detail);
        res.jsonResponse(hyperplanning);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/hyperplanning`);
    }
});

// Store tic tac toe games
router.post('/:version/tic-tac-toe', (req: Request, res: Response) => {
    const { username, move, session, game } = (req.body as Record<string, string>) || {};

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }
    if (!move) {
        error(res, 400, 'Please provide a valid move (&move={move})');
        return;
    }
    if (!session) {
        error(res, 400, 'Please provide a valid session ID (&session={ID})');
        return;
    }
    if (!game) {
        error(res, 400, 'Please provide a valid game ID (&game={ID})');
        return;
    }

    try {
        const result = req.module.tic_tac_toe('play', {
            username,
            move,
            session,
            game,
            storage: ticTacToeStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// Display a tic tac toe game with a token
router.post('/:version/tic-tac-toe/fetch', (req: Request, res: Response) => {
    const { username, game } = (req.body as Record<string, string>) || {};
    const privateGame = ((req.body as Record<string, unknown>) || {}).private as boolean | undefined;

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }

    try {
        const result = req.module.tic_tac_toe('fetch', {
            username,
            game,
            private: privateGame,
            storage: ticTacToeStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// List public tic tac toe games
router.post('/:version/tic-tac-toe/list', (req: Request, res: Response) => {
    try {
        const result = req.module.tic_tac_toe('list', {
            storage: ticTacToeStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// Generate Token
router.post('/:version/token', (req: Request, res: Response) => {
    const body = (req.body as Record<string, unknown>) || {};
    const len = parseInt(String(body.len || 24), 10);
    const type = body.type ? String(body.type).toLowerCase() : 'alpha';

    if (isNaN(len) || len < 0) {
        error(res, 400, 'Invalid number.', `${req.version}/token`);
        return;
    }
    if (len > MAX_TOKEN_LENGTH) {
        error(res, 400, 'Length cannot exceed 4096.', `${req.version}/token`);
        return;
    }
    if (len < MIN_TOKEN_LENGTH) {
        error(res, 400, 'Length cannot be less than 12.', `${req.version}/token`);
        return;
    }

    try {
        const token = req.module.token(len, type);
        res.jsonResponse({ token });
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/token`);
    }
});

export default router;
