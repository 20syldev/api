import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import * as chart from '../../src/modules/v5/chart.js';

// Helper: assert SVG output and return body as string
function svgBody(output: chart.ChartOutput): string {
    assert.equal(output.contentType, 'image/svg+xml');
    return output.body as string;
}

// Helper: assert JSON output and return body as Record
function jsonBody(output: chart.ChartOutput): Record<string, unknown> {
    assert.equal(output.contentType, 'application/json');
    return output.body as Record<string, unknown>;
}

const barData = {
    labels: ['Jan', 'Fév', 'Mar'],
    datasets: [{ label: 'Ventes', values: [10, 25, 15] }],
};

const lineData = {
    labels: ['A', 'B', 'C'],
    datasets: [
        { label: 'Série 1', values: [5, 10, 7] },
        { label: 'Série 2', values: [3, 8, 12] },
    ],
};

const pieData = {
    labels: ['Chrome', 'Firefox', 'Safari'],
    values: [65, 25, 10],
};

describe('chart', () => {
    describe('bar', () => {
        test('returns SVG content type', () => {
            assert.equal(chart.bar(barData, {}).contentType, 'image/svg+xml');
        });
        test('SVG contains <rect elements', () => {
            assert.ok(svgBody(chart.bar(barData, {})).includes('<rect'));
        });
        test('SVG starts with <svg tag', () => {
            assert.ok(svgBody(chart.bar(barData, {})).startsWith('<svg'));
        });
        test('SVG contains X axis labels', () => {
            const body = svgBody(chart.bar(barData, {}));
            assert.ok(body.includes('Jan'));
            assert.ok(body.includes('Fév'));
        });
        test('title is rendered when provided', () => {
            assert.ok(svgBody(chart.bar(barData, { title: 'Mon graphique' })).includes('Mon graphique'));
        });
        test('custom colors appear in SVG', () => {
            assert.ok(svgBody(chart.bar(barData, { colors: ['#ff0000'] })).includes('#ff0000'));
        });
        test('custom bg appears in SVG', () => {
            assert.ok(svgBody(chart.bar(barData, { bg: '#f0f0f0' })).includes('#f0f0f0'));
        });
        test('dataset label in SVG', () => {
            assert.ok(svgBody(chart.bar(barData, {})).includes('Ventes'));
        });
    });

    describe('line', () => {
        test('returns SVG content type', () => {
            assert.equal(chart.line(lineData, {}).contentType, 'image/svg+xml');
        });
        test('SVG contains polyline', () => {
            assert.ok(svgBody(chart.line(lineData, {})).includes('<polyline'));
        });
        test('SVG contains circle points', () => {
            assert.ok(svgBody(chart.line(lineData, {})).includes('<circle'));
        });
        test('both dataset labels present', () => {
            const body = svgBody(chart.line(lineData, {}));
            assert.ok(body.includes('Série 1'));
            assert.ok(body.includes('Série 2'));
        });
        test('title in SVG', () => {
            assert.ok(svgBody(chart.line(lineData, { title: 'Courbe' })).includes('Courbe'));
        });
    });

    describe('pie', () => {
        test('returns SVG content type', () => {
            assert.equal(chart.pie(pieData, {}).contentType, 'image/svg+xml');
        });
        test('SVG contains path elements', () => {
            assert.ok(svgBody(chart.pie(pieData, {})).includes('<path'));
        });
        test('SVG contains arc commands', () => {
            assert.ok(svgBody(chart.pie(pieData, {})).includes(' A '));
        });
        test('labels in legend', () => {
            const body = svgBody(chart.pie(pieData, {}));
            assert.ok(body.includes('Chrome'));
            assert.ok(body.includes('Firefox'));
        });
        test('percentages shown in legend', () => {
            assert.ok(svgBody(chart.pie(pieData, {})).includes('65.0%'));
        });
        test('title in SVG', () => {
            assert.ok(svgBody(chart.pie(pieData, { title: 'Parts de marché' })).includes('Parts de march'));
        });
    });

    describe('donut', () => {
        test('returns SVG content type', () => {
            assert.equal(chart.donut(pieData, {}).contentType, 'image/svg+xml');
        });
        test('SVG contains path with inner arc (donut path uses 2 arcs)', () => {
            const donutSvg = svgBody(chart.donut(pieData, {}));
            const pieSvg = svgBody(chart.pie(pieData, {}));
            // Donut paths have both outer and inner arc commands
            const arcCount = (donutSvg.match(/ A /g) || []).length;
            const piePaths = (pieSvg.match(/ A /g) || []).length;
            // Donut has more arc commands than pie (inner circle adds arcs)
            assert.ok(arcCount > piePaths);
        });
        test('labels in legend', () => {
            assert.ok(svgBody(chart.donut(pieData, {})).includes('Chrome'));
        });
    });

    describe('XML escaping', () => {
        test('labels with < are escaped', () => {
            const d = { labels: ['a<b', 'c'], datasets: [{ label: '', values: [1, 2] }] };
            const body = svgBody(chart.bar(d, {}));
            assert.ok(body.includes('a&lt;b'));
            assert.ok(!body.includes('a<b'));
        });
        test('labels with & are escaped', () => {
            const d = { labels: ['a&b', 'c'], datasets: [{ label: '', values: [1, 2] }] };
            assert.ok(svgBody(chart.bar(d, {})).includes('a&amp;b'));
        });
        test('labels with " are escaped', () => {
            const d = { labels: ['a"b', 'c'], datasets: [{ label: '', values: [1, 2] }] };
            assert.ok(svgBody(chart.line(d, {})).includes('a&quot;b'));
        });
    });

    describe('validation', () => {
        test('labels > 20 throws', () => {
            const d = {
                labels: Array.from({ length: 21 }, (_, i) => `L${i}`),
                datasets: [{ label: '', values: Array(21).fill(1) }],
            };
            assert.throws(() => chart.bar(d, {}), /Cannot exceed 20 labels/);
        });
        test('datasets > 5 throws', () => {
            const d = {
                labels: ['a'],
                datasets: Array.from({ length: 6 }, () => ({ label: '', values: [1] })),
            };
            assert.throws(() => chart.bar(d, {}), /Cannot exceed 5 datasets/);
        });
        test('values length mismatch throws', () => {
            const d = { labels: ['a', 'b'], datasets: [{ label: '', values: [1] }] };
            assert.throws(() => chart.bar(d, {}), /same length/);
        });
        test('missing data throws', () => {
            assert.throws(() => chart.bar(null, {}), /'data' is required/);
        });
        test('negative pie values throw', () => {
            const d = { labels: ['a', 'b'], values: [-1, 5] };
            assert.throws(() => chart.pie(d, {}), /non-negative/);
        });
        test('all-zero pie values throw', () => {
            const d = { labels: ['a', 'b'], values: [0, 0] };
            assert.throws(() => chart.pie(d, {}), /positive/);
        });
    });

    describe('responsive / display size', () => {
        test('no width/height → svg tag has no width/height attrs', () => {
            const body = svgBody(chart.bar(barData, {}));
            assert.ok(!/<svg[^>]*\swidth="/.test(body));
            assert.ok(!/<svg[^>]*\sheight="/.test(body));
        });
        test('viewBox always present', () => {
            assert.ok(svgBody(chart.bar(barData, {})).includes('viewBox="0 0 600 400"'));
        });
        test('width=1000 → svg tag has width attr', () => {
            assert.ok(/<svg[^>]*\swidth="1000"/.test(svgBody(chart.bar(barData, { width: 1000 }))));
        });
        test('height=300 → svg tag has height attr', () => {
            assert.ok(/<svg[^>]*\sheight="300"/.test(svgBody(chart.bar(barData, { height: 300 }))));
        });
    });

    describe('legend toggle', () => {
        test('legend shown by default for bar', () => {
            assert.ok(svgBody(chart.bar(barData, {})).includes('Ventes'));
        });
        test('legend: false hides legend for bar', () => {
            assert.ok(!svgBody(chart.bar(barData, { legend: false })).includes('Ventes'));
        });
        test('legend: false hides legend for pie', () => {
            assert.ok(!svgBody(chart.pie(pieData, { legend: false })).includes('Chrome'));
        });
        test('legend: false hides legend for line', () => {
            assert.ok(!svgBody(chart.line(lineData, { legend: false })).includes('Série 1'));
        });
    });

    describe('mode: data', () => {
        test('bar data mode returns application/json', () => {
            assert.equal(chart.bar(barData, { mode: 'data' }).contentType, 'application/json');
        });
        test('bar data mode body has labels, datasets and scale', () => {
            const body = jsonBody(chart.bar(barData, { mode: 'data' }));
            assert.equal(body.type, 'bar');
            assert.deepEqual(body.labels, barData.labels);
            assert.ok(Array.isArray(body.datasets));
            assert.ok(body.scale);
        });
        test('pie data mode returns slices with percentage', () => {
            const body = jsonBody(chart.pie(pieData, { mode: 'data' }));
            const slices = body.slices as Array<{ label: string; value: number; percentage: number }>;
            assert.equal(slices[0]!.label, 'Chrome');
            assert.equal(slices[0]!.percentage, 65);
            assert.equal(body.total, 100);
        });
        test('donut data mode same structure as pie', () => {
            const body = jsonBody(chart.donut(pieData, { mode: 'data' }));
            assert.equal(body.type, 'donut');
            assert.ok(Array.isArray(body.slices));
        });
        test('line data mode has scale', () => {
            const body = jsonBody(chart.line(lineData, { mode: 'data' }));
            assert.equal(body.type, 'line');
            assert.ok(body.scale);
        });
        test('svg mode (explicit) still returns SVG', () => {
            assert.equal(chart.bar(barData, { mode: 'svg' }).contentType, 'image/svg+xml');
        });
    });
});
