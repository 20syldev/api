import { checkRateLimit } from "./utils.js";

/**
 * Manages a chat system with public and private messages
 *
 * @param {string} action - The action to perform ('message' or 'private')
 * @param {Object} params - The parameters for the action
 * @returns {Object} - The result of the action
 * @throws {Error} - If parameters are invalid
 */
export default function chat(action, params = {}) {
    // In-memory storage
    const storage = params.storage || {};

    // Initialize storage
    storage.messages ??= [];
    storage.privateChats ??= {};
    storage.sessions ??= {};
    storage.rateLimits ??= {};

    // Reference the storage properties
    const { messages, privateChats, sessions, rateLimits } = storage;

    // Input validation for common parameters
    if (!params.username) throw new Error('Please provide a username');

    const u = params.username.toLowerCase();
    const now = Date.now();

    // Rate limiting
    checkRateLimit(rateLimits, u, now);

    // Handle different actions
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

/**
 * Send a new message
 */
function sendMessage(params, messages, privateChats, sessions, u, now) {
    const { message, session, token } = params;

    // Input validation for message action
    if (!message) throw new Error('Please provide a message');
    if (!session) throw new Error('Please provide a valid session ID');

    // Session validation
    if (sessions[u] && sessions[u].user !== session) {
        throw new Error('Session ID mismatch');
    }

    // Create message object
    const msg = {
        username: params.username,
        message,
        timestamp: params.timestamp || new Date().toISOString()
    };

    // Store message based on whether it's private or public
    if (token) {
        privateChats[token] = privateChats[token] || [];
        privateChats[token].push(msg);
        setTimeout(() => { delete privateChats[token]; }, 3600000);
    } else {
        messages.push(msg);
        setTimeout(() => messages.splice(messages.indexOf(msg), 1), 3600000);
    }

    // Update session
    sessions[u] = sessions[u] || { user: session, last: now };
    sessions[u].last = now;

    setTimeout(() => {
        if (now - sessions[u].last >= 3600000) delete sessions[u];
    }, 3600000);

    return { message: 'Message sent successfully' };
}

/**
 * Get private chat messages
 */
function getPrivateChat(params, privateChats) {
    const { token } = params;

    // Input validation for private action
    if (!token) throw new Error('Please provide a valid token');

    // Return messages if token exists
    if (privateChats[token]) return privateChats[token];

    throw new Error('Invalid or expired token.');
}

/**
 * Fetch all public messages
 */
function fetchMessages(messages) {
    if (messages.length > 0) return messages;
    throw new Error('No messages stored.');
}