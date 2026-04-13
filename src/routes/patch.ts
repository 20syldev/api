import { Router, type Request, type Response } from 'express';
import { ticTacToeStorage } from '../storage/index.js';
import { error } from '../utils/response.js';

const router = Router();

// Play a tic-tac-toe move
router.patch('/:version/tic-tac-toe/:game', (req: Request, res: Response) => {
    if (req.version !== 'v4') {
        error(res, 405, 'PATCH is only supported in v4+.', `${req.version}/tic-tac-toe`);
        return;
    }

    const game = req.params.game as string;
    const { username, move, session } = (req.body as Record<string, string>) || {};

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

export default router;
