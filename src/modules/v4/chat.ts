import { checkRateLimit } from './utils.js';
import { SESSION_TTL } from '../../constants.js';
import type { ChatStorage, ChatMessage } from '../../types/storage.js';

interface ChatParams {
    username: string;
    message?: string;
    timestamp?: string;
    session?: string;
    token?: string;
    storage: ChatStorage;
}

export default function chat(action: string, params: ChatParams): ChatMessage[] | ChatMessage | { message: string } {
    const storage = params.storage;

    storage.messages ??= [];
    storage.privateChats ??= {};
    storage.sessions ??= {};
    storage.rateLimits ??= {};

    const { messages, privateChats, sessions, rateLimits } = storage;

    if (!params.username) throw new Error('Please provide a username');

    const u = params.username.toLowerCase();
    const now = Date.now();

    checkRateLimit(rateLimits, u, now);

    if (action === 'message') {
        return sendMessage(params, messages, privateChats, sessions, u, now);
    } else if (action === 'private') {
        return getPrivateChat(params, privateChats);
    } else if (action === 'fetch') {
        return fetchMessages(messages);
    } else {
        throw new Error('Invalid action. Use "message", "private", or "fetch"');
    }
}

function sendMessage(
    params: ChatParams,
    messages: ChatMessage[],
    privateChats: Record<string, ChatMessage[]>,
    sessions: Record<string, { user: string; last: number }>,
    u: string,
    now: number,
): { message: string } {
    const { message, session, token } = params;

    if (!message) throw new Error('Please provide a message');
    if (!session) throw new Error('Please provide a valid session ID');

    if (sessions[u] && sessions[u].user !== session) {
        throw new Error('Session ID mismatch');
    }

    const msg: ChatMessage = {
        username: params.username,
        message,
        timestamp: params.timestamp || new Date().toISOString(),
    };

    if (token) {
        privateChats[token] = privateChats[token] || [];
        privateChats[token]!.push(msg);
        setTimeout(() => {
            delete privateChats[token];
        }, SESSION_TTL);
    } else {
        messages.push(msg);
        setTimeout(() => messages.splice(messages.indexOf(msg), 1), SESSION_TTL);
    }

    sessions[u] = sessions[u] || { user: session, last: now };
    sessions[u]!.last = now;

    setTimeout(() => {
        if (sessions[u] && now - sessions[u].last >= SESSION_TTL) delete sessions[u];
    }, SESSION_TTL);

    return { message: 'Message sent successfully' };
}

function getPrivateChat(params: ChatParams, privateChats: Record<string, ChatMessage[]>): ChatMessage[] {
    const { token } = params;

    if (!token) throw new Error('Please provide a valid token');

    if (privateChats[token]) return privateChats[token];

    throw new Error('Invalid or expired token.');
}

function fetchMessages(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length > 0) return messages;
    throw new Error('No messages stored.');
}
