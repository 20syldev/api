import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import * as matrix from '../../src/modules/v5/matrix.js';

const EPSILON = 1e-6;

function approxEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < EPSILON;
}

function matrixApproxEqual(a: number[][], b: number[][]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i]!.length !== b[i]!.length) return false;
        for (let j = 0; j < a[i]!.length; j++) {
            if (!approxEqual(a[i]![j]!, b[i]![j]!)) return false;
        }
    }
    return true;
}

const A = [
    [1, 2],
    [3, 4],
];
const B = [
    [5, 6],
    [7, 8],
];
const I2 = [
    [1, 0],
    [0, 1],
];

describe('matrix', () => {
    describe('add', () => {
        test('2×2 addition', () => {
            const { result } = matrix.add(A, B);
            assert.deepEqual(result, [
                [6, 8],
                [10, 12],
            ]);
        });
        test('returns correct dimensions', () => {
            const { dimensions } = matrix.add(A, B);
            assert.deepEqual(dimensions, { rows: 2, cols: 2 });
        });
        test('dimension mismatch throws', () => {
            assert.throws(
                () =>
                    matrix.add(
                        [[1, 2]],
                        [
                            [1, 2],
                            [3, 4],
                        ],
                    ),
                /same dimensions/,
            );
        });
    });

    describe('subtract', () => {
        test('2×2 subtraction', () => {
            const { result } = matrix.subtract(B, A);
            assert.deepEqual(result, [
                [4, 4],
                [4, 4],
            ]);
        });
        test('dimension mismatch throws', () => {
            assert.throws(() => matrix.subtract([[1]], [[1, 2]]), /same dimensions/);
        });
    });

    describe('multiply', () => {
        test('2×2 multiply', () => {
            const { result } = matrix.multiply(A, B);
            assert.deepEqual(result, [
                [19, 22],
                [43, 50],
            ]);
        });
        test('2×3 × 3×2 yields 2×2', () => {
            const m1 = [
                [1, 2, 3],
                [4, 5, 6],
            ];
            const m2 = [
                [7, 8],
                [9, 10],
                [11, 12],
            ];
            const { result, dimensions } = matrix.multiply(m1, m2);
            assert.deepEqual(result, [
                [58, 64],
                [139, 154],
            ]);
            assert.deepEqual(dimensions, { rows: 2, cols: 2 });
        });
        test('incompatible dimensions throw', () => {
            assert.throws(() => matrix.multiply([[1, 2]], [[1, 2]]), /columns.*rows/);
        });
    });

    describe('scalar', () => {
        test('multiply by 2', () => {
            const { result } = matrix.scalar(A, 2);
            assert.deepEqual(result, [
                [2, 4],
                [6, 8],
            ]);
        });
        test('multiply by 0', () => {
            const { result } = matrix.scalar(A, 0);
            assert.deepEqual(result, [
                [0, 0],
                [0, 0],
            ]);
        });
        test('non-number scalar throws', () => {
            assert.throws(() => matrix.scalar(A, 'x'), /finite number/);
        });
    });

    describe('transpose', () => {
        test('2×2 transpose', () => {
            const { result } = matrix.transpose([
                [1, 2],
                [3, 4],
            ]);
            assert.deepEqual(result, [
                [1, 3],
                [2, 4],
            ]);
        });
        test('3×2 → 2×3', () => {
            const { result, dimensions } = matrix.transpose([
                [1, 2],
                [3, 4],
                [5, 6],
            ]);
            assert.deepEqual(result, [
                [1, 3, 5],
                [2, 4, 6],
            ]);
            assert.deepEqual(dimensions, { rows: 2, cols: 3 });
        });
    });

    describe('determinant', () => {
        test('1×1 determinant', () => {
            assert.equal(matrix.determinant([[5]]).result, 5);
        });
        test('2×2 determinant', () => {
            assert.equal(matrix.determinant(A).result, -2);
        });
        test('3×3 determinant', () => {
            const m = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ];
            const { result } = matrix.determinant(m);
            assert.ok(approxEqual(result as number, 0));
        });
        test('known 3×3 determinant', () => {
            const m = [
                [2, -1, 0],
                [-1, 2, -1],
                [0, -1, 2],
            ];
            const { result } = matrix.determinant(m);
            assert.ok(approxEqual(result as number, 4));
        });
        test('non-square throws', () => {
            assert.throws(
                () =>
                    matrix.determinant([
                        [1, 2, 3],
                        [4, 5, 6],
                    ]),
                /square matrix/,
            );
        });
    });

    describe('inverse', () => {
        test('2×2 inverse known values', () => {
            const { result } = matrix.inverse(A);
            const inv = result as number[][];
            assert.ok(approxEqual(inv[0]![0]!, -2));
            assert.ok(approxEqual(inv[0]![1]!, 1));
            assert.ok(approxEqual(inv[1]![0]!, 1.5));
            assert.ok(approxEqual(inv[1]![1]!, -0.5));
        });
        test('A × A⁻¹ ≈ identity', () => {
            const { result } = matrix.inverse(A);
            const inv = result as number[][];
            const { result: product } = matrix.multiply(A, inv);
            assert.ok(matrixApproxEqual(product as number[][], I2));
        });
        test('singular matrix throws', () => {
            assert.throws(
                () =>
                    matrix.inverse([
                        [1, 2],
                        [2, 4],
                    ]),
                /singular/,
            );
        });
        test('non-square throws', () => {
            assert.throws(
                () =>
                    matrix.inverse([
                        [1, 2, 3],
                        [4, 5, 6],
                    ]),
                /square matrix/,
            );
        });
    });

    describe('identity', () => {
        test('3×3 identity', () => {
            const { result } = matrix.identity(3);
            assert.deepEqual(result, [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]);
        });
        test('1×1 identity', () => {
            assert.deepEqual(matrix.identity(1).result, [[1]]);
        });
        test('dimensions correct', () => {
            const { dimensions } = matrix.identity(4);
            assert.deepEqual(dimensions, { rows: 4, cols: 4 });
        });
        test('non-integer throws', () => {
            assert.throws(() => matrix.identity(2.5), /positive integer/);
        });
        test('zero throws', () => {
            assert.throws(() => matrix.identity(0), /positive integer/);
        });
        test('size > 20 throws', () => {
            assert.throws(() => matrix.identity(21), /cannot exceed/);
        });
    });

    describe('validation', () => {
        test('non-array throws', () => {
            assert.throws(() => matrix.add('foo', A), /non-empty 2D array/);
        });
        test('empty array throws', () => {
            assert.throws(() => matrix.add([], A), /non-empty 2D array/);
        });
        test('jagged rows throw', () => {
            assert.throws(() => matrix.add([[1, 2], [3]], B), /same length/);
        });
        test('non-number values throw', () => {
            assert.throws(() => matrix.transpose([['a', 'b']]), /finite numbers/);
        });
        test('exceeding 20×20 throws', () => {
            const big = Array.from({ length: 21 }, () => new Array(21).fill(1));
            assert.throws(() => matrix.transpose(big), /cannot exceed/);
        });
    });
});
