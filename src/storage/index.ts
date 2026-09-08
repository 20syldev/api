import type { ChallengeStorage, ChatStorage, IpLimits, TicTacToeStorage } from '../types/storage.js';

export const ipLimits: IpLimits = {};

export const challengeStorage: ChallengeStorage = { usedNonces: new Map() };

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
