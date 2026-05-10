import type { ChatStorage, IpLimits, TicTacToeStorage } from '../types/storage.js';

export const ipLimits: IpLimits = {};

export const chatStorage: ChatStorage = {
    messages: [],
    privateChats: {},
    sessions: {},
    rateLimits: {},
};

export const ticTacToeStorage: TicTacToeStorage = {
    games: {},
    sessions: {},
    rateLimits: {},
};
