const genToken = (chars, length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

export default function token(len, type) {
    const token = {
        alpha: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', len),
        alphanum: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len),
        base64: randomBytes(len).toString('base64').slice(0, len),
        hex: randomBytes(len).toString('hex').slice(0, len),
        num: genToken('0123456789', len),
        punct: genToken('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', len),
        urlsafe: genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', len),
        uuid: v4().replace(/-/g, '').slice(0, len)
    }[type] || genToken('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', len);

    return token;
}