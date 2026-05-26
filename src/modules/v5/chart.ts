import { MAX_CHART_DATASETS, MAX_CHART_LABELS } from '../../constants.js';
import { normalizeColor } from '../../utils/colors.js';

export type ChartOutput =
    | { contentType: 'image/svg+xml'; body: string }
    | { contentType: 'application/json'; body: Record<string, unknown> };

interface Dataset {
    label: string;
    values: number[];
}

interface BarLineData {
    labels: string[];
    datasets: Dataset[];
}

interface PieDonutData {
    labels: string[];
    values: number[];
}

interface ChartOptions {
    title?: unknown;
    width?: unknown;
    height?: unknown;
    colors?: unknown;
    bg?: unknown;
    legend?: unknown;
    mode?: unknown;
}

const DEFAULT_COLORS = [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ac',
];
const DEFAULT_W = 600;
const DEFAULT_H = 400;

const MARGIN = { top: 30, right: 40, bottom: 40, left: 50 };
const TITLE_HEIGHT = 30;
const LEGEND_ROW_H = 18;

// ─── Helpers ───
function escapeXml(str: string): string {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseDisplaySize(v: unknown, name: string): number | null {
    if (v === undefined || v === null) return null;
    const n = Number(v);
    if (!isFinite(n) || n <= 0) throw new Error(`Field '${name}' must be a positive number`);
    return Math.floor(n);
}

function getColors(colors: unknown, n: number): string[] {
    const result: string[] = [];
    if (Array.isArray(colors)) {
        for (const c of colors) {
            result.push(normalizeColor(String(c), DEFAULT_COLORS[result.length % DEFAULT_COLORS.length]!));
        }
    }
    while (result.length < n) {
        result.push(DEFAULT_COLORS[result.length % DEFAULT_COLORS.length]!);
    }
    return result;
}

function svgOpen(
    bg: string,
    renderW: number,
    renderH: number,
    displayW: number | null,
    displayH: number | null,
): string {
    const wAttr = displayW !== null ? ` width="${displayW}"` : '';
    const hAttr = displayH !== null ? ` height="${displayH}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg"${wAttr}${hAttr} viewBox="0 0 ${renderW} ${renderH}">\n  <rect width="${renderW}" height="${renderH}" fill="${bg}"/>\n`;
}

function validateBarLine(data: unknown): BarLineData {
    if (!data || typeof data !== 'object') throw new Error("Field 'data' is required");

    const d = data as Record<string, unknown>;

    if (!Array.isArray(d['labels']) || d['labels'].length === 0)
        throw new Error("Field 'data.labels' must be a non-empty array");
    if (d['labels'].length > MAX_CHART_LABELS) throw new Error(`Cannot exceed ${MAX_CHART_LABELS} labels`);

    if (!Array.isArray(d['datasets']) || d['datasets'].length === 0)
        throw new Error("Field 'data.datasets' must be a non-empty array");
    if (d['datasets'].length > MAX_CHART_DATASETS) throw new Error(`Cannot exceed ${MAX_CHART_DATASETS} datasets`);

    for (const ds of d['datasets'] as unknown[]) {
        const dataset = ds as Record<string, unknown>;

        if (!Array.isArray(dataset['values']) || dataset['values'].length !== d['labels'].length)
            throw new Error("Each dataset's 'values' must have the same length as 'labels'");

        for (const v of dataset['values']) {
            if (typeof v !== 'number' || !isFinite(v)) throw new Error('Dataset values must be finite numbers');
        }
    }

    return {
        labels: (d['labels'] as unknown[]).map(String),
        datasets: (d['datasets'] as Record<string, unknown>[]).map((ds) => ({
            label: String(ds['label'] ?? ''),
            values: ds['values'] as number[],
        })),
    };
}

function validatePieDonut(data: unknown): PieDonutData {
    if (!data || typeof data !== 'object') throw new Error("Field 'data' is required");

    const d = data as Record<string, unknown>;

    if (!Array.isArray(d['labels']) || d['labels'].length === 0)
        throw new Error("Field 'data.labels' must be a non-empty array");
    if (!Array.isArray(d['values']) || d['values'].length === 0)
        throw new Error("Field 'data.values' must be a non-empty array");
    if (d['labels'].length !== d['values'].length)
        throw new Error("Fields 'data.labels' and 'data.values' must have the same length");
    if (d['labels'].length > MAX_CHART_LABELS) throw new Error(`Cannot exceed ${MAX_CHART_LABELS} labels`);

    for (const v of d['values'] as unknown[]) {
        if (typeof v !== 'number' || !isFinite(v) || v < 0)
            throw new Error('Pie/donut values must be non-negative finite numbers');
    }

    const total = (d['values'] as number[]).reduce((s, v) => s + v, 0);
    if (total <= 0) throw new Error('At least one pie/donut value must be positive');

    return {
        labels: (d['labels'] as unknown[]).map(String),
        values: d['values'] as number[],
    };
}

function yScale(values: number[]): { min: number; max: number; gridCount: number } {
    const dataMax = Math.max(...values, 0);
    const dataMin = Math.min(...values, 0);
    const range = dataMax - dataMin || 1;
    const rawStep = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const min = Math.floor(dataMin / step) * step;
    const max = Math.ceil(dataMax / step) * step;
    const gridCount = Math.round((max - min) / step);
    return { min, max, gridCount };
}

function toY(value: number, min: number, max: number, chartH: number): number {
    return chartH - ((value - min) / (max - min)) * chartH;
}

function parseOptions(options: ChartOptions) {
    const displayW = parseDisplaySize(options.width, 'width');
    const displayH = parseDisplaySize(options.height, 'height');
    return {
        renderW: displayW ?? DEFAULT_W,
        renderH: displayH ?? DEFAULT_H,
        displayW,
        displayH,
        bg: normalizeColor(typeof options.bg === 'string' ? options.bg : undefined, '#ffffff'),
        title: typeof options.title === 'string' && options.title ? options.title : '',
        showLegend: options.legend !== false,
        mode: options.mode === 'data' ? 'data' : 'svg',
    };
}

// ─── Bar chart ───
/**
 * Renders a bar chart as SVG or returns its raw data.
 *
 * @param data - Chart data with labels and one or more datasets (each with a name and values array)
 * @param options - Chart options: title, width, height, colors, bg, legend (default true), mode ("svg" or "data")
 * @returns ChartOutput with contentType image/svg+xml (SVG string) or application/json (raw data) depending on mode
 * @throws Error if data is missing, malformed, or exceeds the maximum number of labels or datasets
 */
export function bar(data: unknown, options: ChartOptions): ChartOutput {
    const d = validateBarLine(data);
    const { renderW, renderH, displayW, displayH, bg, title, showLegend, mode } = parseOptions(options);
    const colors = getColors(options.colors, d.datasets.length);

    const allValues = d.datasets.flatMap((ds) => ds.values);
    const { min, max, gridCount } = yScale(allValues);

    if (mode === 'data') {
        return {
            contentType: 'application/json',
            body: {
                type: 'bar',
                labels: d.labels,
                datasets: d.datasets,
                scale: { min, max, gridCount },
            },
        };
    }

    const marginTop = MARGIN.top + (title ? TITLE_HEIGHT : 0);
    const legendH = showLegend && d.datasets.some((ds) => ds.label) ? LEGEND_ROW_H + 10 : 0;
    const chartW = renderW - MARGIN.left - MARGIN.right;
    const chartH = renderH - marginTop - MARGIN.bottom - legendH;

    const groupW = chartW / d.labels.length;
    const barW = (groupW * 0.8) / d.datasets.length;
    const groupPad = groupW * 0.1;

    let svg = svgOpen(bg, renderW, renderH, displayW, displayH);
    if (title)
        svg += `  <text x="${renderW / 2}" y="${MARGIN.top}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">${escapeXml(title)}</text>\n`;

    // Grid lines + Y labels
    for (let i = 0; i <= gridCount; i++) {
        const val = min + i * ((max - min) / gridCount);
        const y = marginTop + toY(val, min, max, chartH);
        svg += `  <line x1="${MARGIN.left}" y1="${y.toFixed(1)}" x2="${MARGIN.left + chartW}" y2="${y.toFixed(1)}" stroke="#e0e0e0" stroke-width="1"/>\n`;
        svg += `  <text x="${MARGIN.left - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="sans-serif" font-size="11" fill="#666">${Number(val.toFixed(4))}</text>\n`;
    }

    // Bars
    d.datasets.forEach((ds, di) => {
        ds.values.forEach((val, li) => {
            const x = MARGIN.left + groupPad + li * groupW + di * barW;
            const bH = Math.abs(toY(val, min, max, chartH) - toY(0, min, max, chartH));
            const y = marginTop + Math.min(toY(val, min, max, chartH), toY(0, min, max, chartH));
            svg += `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bH.toFixed(1)}" fill="${colors[di]}"/>\n`;
        });
    });

    // X axis labels
    d.labels.forEach((label, i) => {
        const x = MARGIN.left + groupPad + i * groupW + (groupW * 0.8) / 2;
        svg += `  <text x="${x.toFixed(1)}" y="${(marginTop + chartH + 20).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(label)}</text>\n`;
    });

    // Axes
    svg += `  <line x1="${MARGIN.left}" y1="${marginTop}" x2="${MARGIN.left}" y2="${marginTop + chartH}" stroke="#999" stroke-width="1"/>\n`;
    svg += `  <line x1="${MARGIN.left}" y1="${marginTop + chartH}" x2="${MARGIN.left + chartW}" y2="${marginTop + chartH}" stroke="#999" stroke-width="1"/>\n`;

    // Legend
    if (showLegend && d.datasets.some((ds) => ds.label)) {
        const legendY = marginTop + chartH + 38;
        let lx = MARGIN.left;
        d.datasets.forEach((ds, di) => {
            svg += `  <rect x="${lx}" y="${legendY - 10}" width="12" height="12" fill="${colors[di]}"/>\n`;
            svg += `  <text x="${lx + 16}" y="${legendY}" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(ds.label)}</text>\n`;
            lx += 16 + ds.label.length * 7 + 12;
        });
    }

    svg += '</svg>';
    return { contentType: 'image/svg+xml', body: svg };
}

// ─── Line chart ───
/**
 * Renders a line chart as SVG or returns its raw data.
 *
 * @param data - Chart data with labels and one or more datasets (each with a name and values array)
 * @param options - Chart options: title, width, height, colors, bg, legend (default true), mode ("svg" or "data")
 * @returns ChartOutput with contentType image/svg+xml (SVG string) or application/json (raw data) depending on mode
 * @throws Error if data is missing, malformed, or exceeds the maximum number of labels or datasets
 */
export function line(data: unknown, options: ChartOptions): ChartOutput {
    const d = validateBarLine(data);
    const { renderW, renderH, displayW, displayH, bg, title, showLegend, mode } = parseOptions(options);
    const colors = getColors(options.colors, d.datasets.length);

    const allValues = d.datasets.flatMap((ds) => ds.values);
    const { min, max, gridCount } = yScale(allValues);

    if (mode === 'data') {
        return {
            contentType: 'application/json',
            body: {
                type: 'line',
                labels: d.labels,
                datasets: d.datasets,
                scale: { min, max, gridCount },
            },
        };
    }

    const marginTop = MARGIN.top + (title ? TITLE_HEIGHT : 0);
    const legendH = showLegend && d.datasets.some((ds) => ds.label) ? LEGEND_ROW_H + 10 : 0;
    const chartW = renderW - MARGIN.left - MARGIN.right;
    const chartH = renderH - marginTop - MARGIN.bottom - legendH;
    const xStep = chartW / Math.max(d.labels.length - 1, 1);

    let svg = svgOpen(bg, renderW, renderH, displayW, displayH);
    if (title)
        svg += `  <text x="${renderW / 2}" y="${MARGIN.top}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">${escapeXml(title)}</text>\n`;

    // Grid lines + Y labels
    for (let i = 0; i <= gridCount; i++) {
        const val = min + i * ((max - min) / gridCount);
        const y = marginTop + toY(val, min, max, chartH);
        svg += `  <line x1="${MARGIN.left}" y1="${y.toFixed(1)}" x2="${MARGIN.left + chartW}" y2="${y.toFixed(1)}" stroke="#e0e0e0" stroke-width="1"/>\n`;
        svg += `  <text x="${MARGIN.left - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="sans-serif" font-size="11" fill="#666">${Number(val.toFixed(4))}</text>\n`;
    }

    // Axes (drawn before data so points appear on top)
    svg += `  <line x1="${MARGIN.left}" y1="${marginTop}" x2="${MARGIN.left}" y2="${marginTop + chartH}" stroke="#999" stroke-width="1"/>\n`;
    svg += `  <line x1="${MARGIN.left}" y1="${marginTop + chartH}" x2="${MARGIN.left + chartW}" y2="${marginTop + chartH}" stroke="#999" stroke-width="1"/>\n`;

    // Lines + points
    d.datasets.forEach((ds, di) => {
        const points = ds.values
            .map((val, i) => {
                const x = MARGIN.left + i * (d.labels.length > 1 ? xStep : chartW / 2);
                const y = marginTop + toY(val, min, max, chartH);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
        svg += `  <polyline points="${points}" fill="none" stroke="${colors[di]}" stroke-width="2" stroke-linejoin="round"/>\n`;
        ds.values.forEach((val, i) => {
            const x = MARGIN.left + i * (d.labels.length > 1 ? xStep : chartW / 2);
            const y = marginTop + toY(val, min, max, chartH);
            svg += `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${colors[di]}"/>\n`;
        });
    });

    // X axis labels
    d.labels.forEach((label, i) => {
        const x = MARGIN.left + i * (d.labels.length > 1 ? xStep : chartW / 2);
        svg += `  <text x="${x.toFixed(1)}" y="${(marginTop + chartH + 20).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(label)}</text>\n`;
    });

    // Legend
    if (showLegend && d.datasets.some((ds) => ds.label)) {
        const legendY = marginTop + chartH + 38;
        let lx = MARGIN.left;
        d.datasets.forEach((ds, di) => {
            svg += `  <rect x="${lx}" y="${legendY - 10}" width="12" height="12" fill="${colors[di]}"/>\n`;
            svg += `  <text x="${lx + 16}" y="${legendY}" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(ds.label)}</text>\n`;
            lx += 16 + ds.label.length * 7 + 12;
        });
    }

    svg += '</svg>';
    return { contentType: 'image/svg+xml', body: svg };
}

// ─── Pie / Donut ───
function pieArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, innerR = 0): string {
    const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
    const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    if (innerR === 0) {
        return [
            `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
            `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
            'Z',
        ].join(' ');
    }

    const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
    const innerEnd = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };

    return [
        `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
        `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
        'Z',
    ].join(' ');
}

function renderPieDonut(type: string, data: unknown, options: ChartOptions, isDonut: boolean): ChartOutput {
    const d = validatePieDonut(data);
    const { renderW, renderH, displayW, displayH, bg, title, showLegend, mode } = parseOptions(options);
    const colors = getColors(options.colors, d.labels.length);

    const total = d.values.reduce((s, v) => s + v, 0);

    if (mode === 'data') {
        return {
            contentType: 'application/json',
            body: {
                type,
                total,
                slices: d.labels.map((label, i) => ({
                    label,
                    value: d.values[i],
                    percentage: Number(((d.values[i]! / total) * 100).toFixed(2)),
                })),
            },
        };
    }

    const titleOffset = title ? TITLE_HEIGHT : 0;
    const legendH = showLegend ? d.labels.length * LEGEND_ROW_H + 10 : 0;
    const chartAreaH = renderH - titleOffset - MARGIN.top - legendH - (showLegend ? 10 : 0);
    const cx = renderW / 2;
    const cy = titleOffset + MARGIN.top + chartAreaH / 2;
    const r = Math.max(10, Math.min(cx - MARGIN.left, chartAreaH / 2 - 10));
    const innerR = isDonut ? r * 0.55 : 0;

    let svg = svgOpen(bg, renderW, renderH, displayW, displayH);
    if (title)
        svg += `  <text x="${renderW / 2}" y="${MARGIN.top + titleOffset - 10}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">${escapeXml(title)}</text>\n`;

    let startAngle = -Math.PI / 2;
    d.values.forEach((val, i) => {
        if (val === 0) return;
        const sweep = (val / total) * 2 * Math.PI;
        const endAngle = startAngle + sweep;
        const path = pieArc(cx, cy, r, startAngle, endAngle, innerR);
        svg += `  <path d="${path}" fill="${colors[i]}" stroke="${bg}" stroke-width="1.5"/>\n`;
        startAngle = endAngle;
    });

    // Legend
    if (showLegend) {
        const legendStartY = titleOffset + MARGIN.top + chartAreaH + 10;
        d.labels.forEach((label, i) => {
            const pct = ((d.values[i]! / total) * 100).toFixed(1);
            const y = legendStartY + i * LEGEND_ROW_H;
            svg += `  <rect x="${MARGIN.left}" y="${y - 10}" width="12" height="12" fill="${colors[i]}"/>\n`;
            svg += `  <text x="${MARGIN.left + 18}" y="${y}" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(label)} (${pct}%)</text>\n`;
        });
    }

    svg += '</svg>';
    return { contentType: 'image/svg+xml', body: svg };
}

/**
 * Renders a pie chart as SVG or returns its raw data.
 *
 * @param data - Chart data with labels and a single dataset (each with a name and values array)
 * @param options - Chart options: title, width, height, colors, bg, legend (default true), mode ("svg" or "data")
 * @returns ChartOutput with contentType image/svg+xml (SVG string) or application/json (raw data) depending on mode
 * @throws Error if data is missing, malformed, or exceeds the maximum number of labels or datasets
 */
export function pie(data: unknown, options: ChartOptions): ChartOutput {
    return renderPieDonut('pie', data, options, false);
}

/**
 * Renders a donut chart as SVG or returns its raw data.
 *
 * @param data - Chart data with labels and a single dataset (each with a name and values array)
 * @param options - Chart options: title, width, height, colors, bg, legend (default true), mode ("svg" or "data")
 * @returns ChartOutput with contentType image/svg+xml (SVG string) or application/json (raw data) depending on mode
 * @throws Error if data is missing, malformed, or exceeds the maximum number of labels or datasets
 */
export function donut(data: unknown, options: ChartOptions): ChartOutput {
    return renderPieDonut('donut', data, options, true);
}
