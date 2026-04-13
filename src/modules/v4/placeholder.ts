type AvatarShape = 'circle' | 'rounded' | 'square';
type AnimateMode = 'shimmer' | 'pulse' | 'none';

export interface PlaceholderOptions {
    width: number;
    height: number;
    bg?: string;
    color?: string;
    text?: string;
    rows?: number;
    avatar?: AvatarShape;
    lines?: number;
    animate?: AnimateMode;
    speed?: number;
    radius?: number;
}

function parseSize(value: string | undefined, name: string, def: number): number {
    if (value === undefined) return def;
    const n = Number(value);
    if (isNaN(n)) throw new Error(`${name} must be a number`);
    if (n < 1 || n > 4000) throw new Error(`${name} must be between 1 and 4000`);
    return Math.floor(n);
}

function normalizeColor(value: string | undefined, def: string): string {
    if (!value) return def;
    const clean = value.startsWith('#') ? value : `#${value}`;
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(clean)) throw new Error('Invalid color (use hex like #ff6600)');
    return clean;
}

function escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateImage(opts: PlaceholderOptions): string {
    const { width, height } = opts;
    const bg = normalizeColor(opts.bg, '#cccccc');
    const color = normalizeColor(opts.color, '#333333');
    const text = escapeXml(opts.text ?? `${width}\u00d7${height}`);
    const fontSize = Math.max(12, Math.min(width, height) / 8);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}" rx="4" />
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="${fontSize}" fill="${color}">${text}</text>
</svg>`;
}

function avatarShape(shape: AvatarShape, x: number, y: number, size: number): string {
    const r = size / 2;
    switch (shape) {
        case 'circle':
            return `<circle cx="${x + r}" cy="${y + r}" r="${r}" />`;
        case 'rounded':
            return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.25)}" />`;
        case 'square':
            return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" />`;
    }
}

function animationDefs(mode: AnimateMode, bg: string, highlight: string, speed: number): string {
    if (mode === 'none') return '';

    if (mode === 'pulse') {
        return `<style>
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .sk { animation: pulse ${speed}s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    </style>`;
    }

    return `<linearGradient id="g">
      <stop offset="0.1" stop-color="${bg}" />
      <stop offset="0.5" stop-color="${highlight}" />
      <stop offset="0.9" stop-color="${bg}" />
      <animateTransform attributeName="gradientTransform" type="translate" values="-2 0; 2 0" dur="${speed}s" repeatCount="indefinite" />
    </linearGradient>`;
}

function generateSkeleton(opts: PlaceholderOptions): string {
    const { width, height } = opts;
    const bg = normalizeColor(opts.bg, '#e5e5e5');
    const highlight = normalizeColor(opts.color, '#f5f5f5');
    const rows = Math.max(0, Math.min(20, opts.rows ?? 3));
    const avatar = opts.avatar;
    const animate = opts.animate ?? 'shimmer';
    const speed = opts.speed ?? 1.5;
    const rx = opts.radius ?? 4;

    const pad = Math.round(width * 0.06);
    const gap = Math.round(Math.max(6, Math.min(14, height * 0.04)));
    const lineH = Math.round(Math.max(8, Math.min(16, ((height - pad * 2) / (rows + (avatar ? 4 : 0))) * 0.65)));

    const shapes: string[] = [];
    let y = pad;

    if (avatar) {
        const size = Math.round(Math.min(width * 0.14, height * 0.24, 48));
        shapes.push(avatarShape(avatar, pad, y, size));

        const lx = pad + size + gap;
        const lw = width - lx - pad;
        const count = Math.max(0, Math.min(2, opts.lines ?? 2));

        if (count === 2) {
            const nameY = Math.max(pad, Math.round(y + size / 2 - (lineH * 2 + gap) / 2));
            shapes.push(`<rect x="${lx}" y="${nameY}" width="${lw * 0.55}" height="${lineH}" rx="${rx}" />`);
            shapes.push(
                `<rect x="${lx}" y="${nameY + lineH + gap}" width="${lw * 0.35}" height="${lineH}" rx="${rx}" />`,
            );
        } else if (count === 1) {
            const nameY = Math.max(pad, Math.round(y + size / 2 - lineH / 2));
            shapes.push(`<rect x="${lx}" y="${nameY}" width="${lw * 0.55}" height="${lineH}" rx="${rx}" />`);
        }

        y += size + gap * 2;
    }

    for (let i = 0; i < rows; i++) {
        const ratio = i === rows - 1 && rows > 1 ? 0.55 : i % 2 === 0 ? 0.92 : 0.78;
        const w = Math.round((width - pad * 2) * ratio);
        shapes.push(`<rect x="${pad}" y="${y}" width="${w}" height="${lineH}" rx="${rx}" />`);
        y += lineH + gap;
    }

    const defs = animationDefs(animate, bg, highlight, speed);
    const fill = animate === 'shimmer' ? 'url(#g)' : bg;
    const cls = animate === 'pulse' ? ' class="sk"' : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="c">
      ${shapes.join('\n      ')}
    </clipPath>
    ${defs}
  </defs>
  <rect width="${width}" height="${height}" clip-path="url(#c)" fill="${fill}"${cls} />
</svg>`;
}

export interface PlaceholderResult {
    type: string;
    contentType: string;
    body: string;
}

const AVATAR_SHAPES = new Set(['circle', 'rounded', 'square']);
const ANIMATE_MODES = new Set(['shimmer', 'pulse', 'none']);

function parseAvatar(value: string | undefined): AvatarShape | undefined {
    if (!value) return undefined;
    if (value === 'true' || value === '1') return 'circle';
    if (AVATAR_SHAPES.has(value)) return value as AvatarShape;
    throw new Error('avatar must be one of: circle, rounded, square');
}

function parseAnimate(value: string | undefined): AnimateMode {
    if (!value) return 'shimmer';
    if (ANIMATE_MODES.has(value)) return value as AnimateMode;
    throw new Error('animate must be one of: shimmer, pulse, none');
}

export default function placeholder(type: string, query: Record<string, string | undefined>): PlaceholderResult {
    const speed = query.speed ? parseFloat(query.speed) : 1.5;
    if (isNaN(speed) || speed < 0.1 || speed > 10) throw new Error('speed must be between 0.1 and 10');

    const radius = query.radius ? parseInt(query.radius, 10) : 4;
    if (isNaN(radius) || radius < 0 || radius > 50) throw new Error('radius must be between 0 and 50');

    const opts: PlaceholderOptions = {
        width: parseSize(query.width, 'width', 800),
        height: parseSize(query.height, 'height', 600),
        bg: query.bg,
        color: query.color,
        text: query.text,
        rows: query.rows ? parseInt(query.rows, 10) : undefined,
        avatar: parseAvatar(query.avatar),
        lines: query.lines ? parseInt(query.lines, 10) : 2,
        animate: parseAnimate(query.animate),
        speed,
        radius,
    };

    switch (type) {
        case 'image':
            return { type, contentType: 'image/svg+xml', body: generateImage(opts) };
        case 'skeleton':
            return { type, contentType: 'image/svg+xml', body: generateSkeleton(opts) };
        default:
            throw new Error('Type must be one of: image, skeleton');
    }
}
