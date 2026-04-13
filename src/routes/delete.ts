import { Router, type Request, type Response } from 'express';
import { chatStorage, ticTacToeStorage } from '../storage/index.js';
import { error } from '../utils/response.js';

const router = Router();

// Clear a private chat
router.delete('/:version/chat/:token', (req: Request, res: Response) => {
    if (req.version !== 'v4') {
        error(res, 405, 'DELETE is only supported in v4+.', `${req.version}/chat`);
        return;
    }

    const token = req.params.token as string;
    const { username, session } = (req.body as Record<string, string>) || {};

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }
    if (!session) {
        error(res, 400, 'Please provide a valid session ID (&session={ID})');
        return;
    }

    try {
        const result = req.module.chat('clear', {
            username,
            token,
            session,
            storage: chatStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// Forfeit a tic-tac-toe game
router.delete('/:version/tic-tac-toe/:game', (req: Request, res: Response) => {
    if (req.version !== 'v4') {
        error(res, 405, 'DELETE is only supported in v4+.', `${req.version}/tic-tac-toe`);
        return;
    }

    const game = req.params.game as string;
    const { username, session } = (req.body as Record<string, string>) || {};

    if (!username) {
        error(res, 400, 'Please provide a username (?username={username})');
        return;
    }
    if (!session) {
        error(res, 400, 'Please provide a valid session ID (&session={ID})');
        return;
    }

    try {
        const result = req.module.tic_tac_toe('forfeit', {
            username,
            session,
            game,
            storage: ticTacToeStorage,
        });
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

export default router;
