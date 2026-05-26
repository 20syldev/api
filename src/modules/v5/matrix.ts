import { MAX_MATRIX_SIZE } from '../../constants.js';

export type Matrix = number[][];

export interface MatrixResult {
    operation: string;
    result: Matrix | number;
    dimensions: { rows: number; cols: number };
}

// ─── Validation ───
function validateMatrix(m: unknown, name = 'matrix'): Matrix {
    if (!Array.isArray(m) || m.length === 0) {
        throw new Error(`Field '${name}' must be a non-empty 2D array`);
    }
    const cols = (m[0] as unknown[]).length;
    if (cols === 0) throw new Error(`Field '${name}' rows must be non-empty`);
    for (const row of m) {
        if (!Array.isArray(row) || row.length !== cols) {
            throw new Error(`All rows in '${name}' must have the same length`);
        }
        for (const cell of row) {
            if (typeof cell !== 'number' || !isFinite(cell)) {
                throw new Error(`Field '${name}' must contain finite numbers only`);
            }
        }
    }
    if (m.length > MAX_MATRIX_SIZE || cols > MAX_MATRIX_SIZE) {
        throw new Error(`Matrix dimensions cannot exceed ${MAX_MATRIX_SIZE}×${MAX_MATRIX_SIZE}`);
    }
    return m as Matrix;
}

function dims(m: Matrix): { rows: number; cols: number } {
    return { rows: m.length, cols: m[0]!.length };
}

function assertSquare(m: Matrix, op: string): void {
    const { rows, cols } = dims(m);
    if (rows !== cols) throw new Error(`Operation '${op}' requires a square matrix`);
}

function assertSameDimensions(a: Matrix, b: Matrix): void {
    if (a.length !== b.length || a[0]!.length !== b[0]!.length) {
        throw new Error('Both matrices must have the same dimensions');
    }
}

function copy(m: Matrix): Matrix {
    return m.map((row) => [...row]);
}

// ─── Operations ───
/**
 * Adds two matrices element-wise.
 *
 * @param matrix - First matrix (2D array of finite numbers)
 * @param matrix2 - Second matrix (must have the same dimensions as matrix)
 * @returns MatrixResult with the resulting matrix and its dimensions
 * @throws Error if either argument is not a valid matrix or dimensions do not match
 */
export function add(matrix: unknown, matrix2: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    const b = validateMatrix(matrix2, 'matrix2');
    assertSameDimensions(a, b);
    const result = a.map((row, i) => row.map((v, j) => v + b[i]![j]!));
    return { operation: 'add', result, dimensions: dims(result) };
}

/**
 * Subtracts the second matrix from the first element-wise.
 *
 * @param matrix - Matrix to subtract from (2D array of finite numbers)
 * @param matrix2 - Matrix to subtract (must have the same dimensions as matrix)
 * @returns MatrixResult with the resulting matrix and its dimensions
 * @throws Error if either argument is not a valid matrix or dimensions do not match
 */
export function subtract(matrix: unknown, matrix2: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    const b = validateMatrix(matrix2, 'matrix2');
    assertSameDimensions(a, b);
    const result = a.map((row, i) => row.map((v, j) => v - b[i]![j]!));
    return { operation: 'subtract', result, dimensions: dims(result) };
}

/**
 * Multiplies two matrices using standard matrix multiplication.
 *
 * @param matrix - Left-hand matrix (2D array of finite numbers)
 * @param matrix2 - Right-hand matrix; its row count must equal matrix's column count
 * @returns MatrixResult with the resulting matrix and its dimensions
 * @throws Error if either argument is not a valid matrix or inner dimensions are incompatible
 */
export function multiply(matrix: unknown, matrix2: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    const b = validateMatrix(matrix2, 'matrix2');
    const { rows: ar, cols: ac } = dims(a);
    const { rows: br, cols: bc } = dims(b);
    if (ac !== br) {
        throw new Error(`Cannot multiply: columns of first matrix (${ac}) must equal rows of second (${br})`);
    }
    const result: Matrix = Array.from({ length: ar }, () => new Array(bc).fill(0) as number[]);
    for (let i = 0; i < ar; i++) {
        for (let j = 0; j < bc; j++) {
            let sum = 0;
            for (let k = 0; k < ac; k++) {
                sum += a[i]![k]! * b[k]![j]!;
            }
            result[i]![j] = sum;
        }
    }
    return { operation: 'multiply', result, dimensions: dims(result) };
}

/**
 * Multiplies every element of a matrix by a scalar value.
 *
 * @param matrix - Matrix to scale (2D array of finite numbers)
 * @param scalarVal - Finite number to multiply each element by
 * @returns MatrixResult with the scaled matrix and its dimensions
 * @throws Error if matrix is invalid or scalarVal is not a finite number
 */
export function scalar(matrix: unknown, scalarVal: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    if (typeof scalarVal !== 'number' || !isFinite(scalarVal)) {
        throw new Error("Field 'scalar' must be a finite number");
    }
    const result = a.map((row) => row.map((v) => v * scalarVal));
    return { operation: 'scalar', result, dimensions: dims(result) };
}

/**
 * Transposes a matrix, swapping its rows and columns.
 *
 * @param matrix - Matrix to transpose (2D array of finite numbers)
 * @returns MatrixResult with the transposed matrix and its dimensions
 * @throws Error if matrix is not a valid 2D array of finite numbers
 */
export function transpose(matrix: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    const { rows, cols } = dims(a);
    const result: Matrix = Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (__, i) => a[i]![j]!));
    return { operation: 'transpose', result, dimensions: dims(result) };
}

function gaussElim(m: Matrix): { lu: Matrix; sign: number } {
    const n = m.length;
    const lu = copy(m);
    let sign = 1;

    for (let col = 0; col < n; col++) {
        // Partial pivoting
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(lu[row]![col]!) > Math.abs(lu[maxRow]![col]!)) maxRow = row;
        }
        if (maxRow !== col) {
            [lu[col], lu[maxRow]] = [lu[maxRow]!, lu[col]!];
            sign *= -1;
        }

        const pivot = lu[col]![col]!;
        if (pivot === 0) continue;

        for (let row = col + 1; row < n; row++) {
            const factor = lu[row]![col]! / pivot;
            for (let k = col; k < n; k++) {
                lu[row]![k]! -= factor * lu[col]![k]!;
            }
        }
    }

    return { lu, sign };
}

/**
 * Computes the determinant of a square matrix using Gaussian elimination with partial pivoting.
 *
 * @param matrix - Square matrix (2D array of finite numbers)
 * @returns MatrixResult with the determinant as a scalar result and the input dimensions
 * @throws Error if matrix is not a valid square matrix
 */
export function determinant(matrix: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    assertSquare(a, 'determinant');
    const n = a.length;

    if (n === 1) return { operation: 'determinant', result: a[0]![0]!, dimensions: dims(a) };
    if (n === 2) {
        const det = a[0]![0]! * a[1]![1]! - a[0]![1]! * a[1]![0]!;
        return { operation: 'determinant', result: det, dimensions: dims(a) };
    }

    const { lu, sign } = gaussElim(a);
    let det = sign;
    for (let i = 0; i < n; i++) det *= lu[i]![i]!;

    const result = Number(det.toFixed(10));
    return { operation: 'determinant', result, dimensions: dims(a) };
}

/**
 * Computes the inverse of a square matrix using Gauss-Jordan elimination.
 *
 * @param matrix - Square matrix (2D array of finite numbers)
 * @returns MatrixResult with the inverted matrix and its dimensions
 * @throws Error if matrix is not a valid square matrix or is singular (determinant is 0)
 */
export function inverse(matrix: unknown): MatrixResult {
    const a = validateMatrix(matrix);
    assertSquare(a, 'inverse');
    const n = a.length;

    // Build augmented matrix [A | I]
    const aug: Matrix = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

    // Gauss-Jordan elimination
    for (let col = 0; col < n; col++) {
        // Partial pivoting
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) maxRow = row;
        }
        if (maxRow !== col) [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];

        const pivot = aug[col]![col]!;
        if (Math.abs(pivot) < 1e-12) throw new Error('Matrix is singular (determinant is 0)');

        for (let k = 0; k < 2 * n; k++) aug[col]![k]! /= pivot;

        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row]![col]!;
            for (let k = 0; k < 2 * n; k++) {
                aug[row]![k]! -= factor * aug[col]![k]!;
            }
        }
    }

    // Extract right half
    const result: Matrix = aug.map((row) => row.slice(n).map((v) => Number(v.toFixed(10))));

    return { operation: 'inverse', result, dimensions: dims(result) };
}

/**
 * Generates an n×n identity matrix.
 *
 * @param n - Size of the identity matrix (positive integer, max MAX_MATRIX_SIZE)
 * @returns MatrixResult with the identity matrix and its dimensions
 * @throws Error if n is not a positive integer or exceeds the maximum allowed size
 */
export function identity(n: unknown): MatrixResult {
    if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
        throw new Error("Field 'scalar' must be a positive integer for the identity operation");
    }
    if (n > MAX_MATRIX_SIZE) {
        throw new Error(`Identity size cannot exceed ${MAX_MATRIX_SIZE}`);
    }
    const result: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
    return { operation: 'identity', result, dimensions: { rows: n, cols: n } };
}
