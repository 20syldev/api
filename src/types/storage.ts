export interface LogEntry {
    timestamp: string;
    method: string;
    url: string;
    status: number;
    duration: string;
    platform: string | undefined;
}

export interface ChatMessage {
    username: string;
    message: string;
    timestamp: string;
}

export interface ChatStorage {
    messages: ChatMessage[];
    privateChats: Record<string, ChatMessage[]>;
    sessions: Record<string, { user: string; last: number }>;
    rateLimits: Record<string, number[]>;
}

export interface TicTacToeMove {
    username: string;
    move: string;
    session: string;
}

export interface TicTacToeGame {
    moves: TicTacToeMove[];
    players: string[];
    private: boolean;
    creation: number;
}

export interface TicTacToeStorage {
    games: Record<string, TicTacToeGame>;
    sessions: Record<string, { user: string; last: number }>;
    rateLimits: Record<string, number[]>;
}

export interface IpLimits {
    [ip: string]: {
        [hour: string]: {
            [minute: string]: number;
        };
    };
}
