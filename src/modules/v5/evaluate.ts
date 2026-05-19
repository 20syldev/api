import { MAX_EXPR_DEPTH, MAX_EXPR_LENGTH } from '../../constants.js';

export interface EvaluateResult {
    expression: string;
    result: number;
    precision: number;
}

// ─── Tokenizer ───
type TokenType = 'NUMBER' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA';

interface Token {
    type: TokenType;
    value: string;
}

function tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expr.length) {
        const ch = expr[i]!;

        if (' \t\r\n'.includes(ch)) {
            i++;
            continue;
        }

        if ((ch >= '0' && ch <= '9') || ch === '.') {
            let num = '';
            while (i < expr.length && ((expr[i]! >= '0' && expr[i]! <= '9') || expr[i] === '.')) {
                num += expr[i++];
            }
            tokens.push({ type: 'NUMBER', value: num });
            continue;
        }

        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
            let ident = '';
            while (
                i < expr.length &&
                ((expr[i]! >= 'a' && expr[i]! <= 'z') ||
                    (expr[i]! >= 'A' && expr[i]! <= 'Z') ||
                    expr[i] === '_' ||
                    (expr[i]! >= '0' && expr[i]! <= '9'))
            ) {
                ident += expr[i++];
            }
            tokens.push({ type: 'IDENT', value: ident });
            continue;
        }

        if ('+-*/%^'.includes(ch)) {
            tokens.push({ type: 'OP', value: ch });
            i++;
            continue;
        }

        if (ch === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            i++;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            i++;
            continue;
        }
        if (ch === ',') {
            tokens.push({ type: 'COMMA', value: ',' });
            i++;
            continue;
        }

        throw new Error(`Unexpected character: '${ch}'`);
    }

    return tokens;
}

// ─── AST ───
type ASTNode =
    | { kind: 'number'; value: number }
    | { kind: 'unary'; op: string; operand: ASTNode }
    | { kind: 'binary'; op: string; left: ASTNode; right: ASTNode }
    | { kind: 'call'; name: string; args: ASTNode[] }
    | { kind: 'const'; name: string };

// ─── Binding powers ───
const LEFT_BP: Record<string, number> = { '+': 10, '-': 10, '*': 20, '/': 20, '%': 20, '^': 31 };
const RIGHT_BP: Record<string, number> = { '+': 10, '-': 10, '*': 20, '/': 20, '%': 20, '^': 30 };

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };
const FUNCTIONS = new Set([
    'sqrt',
    'abs',
    'ceil',
    'floor',
    'round',
    'sin',
    'cos',
    'tan',
    'log',
    'log2',
    'log10',
    'exp',
    'min',
    'max',
]);

// ─── Parser ───
class Parser {
    private pos = 0;
    private depth = 0;

    constructor(private tokens: Token[]) {}

    private peek(): Token | undefined {
        return this.tokens[this.pos];
    }

    private consume(): Token {
        const t = this.tokens[this.pos];
        if (!t) throw new Error('Unexpected end of expression');
        this.pos++;
        return t;
    }

    private expect(type: TokenType): Token {
        const t = this.consume();
        if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type} ('${t.value}')`);
        return t;
    }

    parse(minBp = 0): ASTNode {
        if (++this.depth > MAX_EXPR_DEPTH) throw new Error('Expression is too deeply nested');

        let left = this.parsePrefix();

        while (true) {
            const t = this.peek();
            if (!t || t.type !== 'OP') break;
            const lbp = LEFT_BP[t.value];
            if (lbp === undefined || lbp <= minBp) break;
            this.consume();
            const rbp = RIGHT_BP[t.value]!;
            const right = this.parse(rbp);
            left = { kind: 'binary', op: t.value, left, right };
        }

        this.depth--;
        return left;
    }

    private parsePrefix(): ASTNode {
        const t = this.peek();
        if (!t) throw new Error('Unexpected end of expression');

        // Unary +/-
        if (t.type === 'OP' && (t.value === '+' || t.value === '-')) {
            this.consume();
            const operand = this.parse(40);
            if (t.value === '+') return operand;
            return { kind: 'unary', op: '-', operand };
        }

        // Number
        if (t.type === 'NUMBER') {
            this.consume();
            const v = parseFloat(t.value);
            if (isNaN(v)) throw new Error(`Invalid number: ${t.value}`);
            return { kind: 'number', value: v };
        }

        // Parenthesized expression
        if (t.type === 'LPAREN') {
            this.consume();
            const node = this.parse(0);
            this.expect('RPAREN');
            return node;
        }

        // Identifier: constant or function call
        if (t.type === 'IDENT') {
            this.consume();
            const name = t.value;

            // Function call
            if (this.peek()?.type === 'LPAREN') {
                if (!FUNCTIONS.has(name)) throw new Error(`Unknown function: '${name}'`);
                this.consume(); // (
                const args: ASTNode[] = [];
                if (this.peek()?.type !== 'RPAREN') {
                    args.push(this.parse(0));
                    while (this.peek()?.type === 'COMMA') {
                        this.consume();
                        args.push(this.parse(0));
                    }
                }
                this.expect('RPAREN');
                return { kind: 'call', name, args };
            }

            // Constant
            if (Object.hasOwn(CONSTANTS, name)) return { kind: 'const', name };
            throw new Error(`Unknown identifier: '${name}'`);
        }

        throw new Error(`Unexpected token: '${t.value}'`);
    }

    run(): ASTNode {
        const ast = this.parse(0);
        if (this.pos < this.tokens.length) {
            throw new Error(`Unexpected token after expression: '${this.tokens[this.pos]!.value}'`);
        }
        return ast;
    }
}

// ─── Evaluator ───
function evalNode(node: ASTNode): number {
    switch (node.kind) {
        case 'number':
            return node.value;

        case 'const':
            return CONSTANTS[node.name]!;

        case 'unary':
            return -evalNode(node.operand);

        case 'binary': {
            const l = evalNode(node.left);
            const r = evalNode(node.right);
            switch (node.op) {
                case '+':
                    return l + r;
                case '-':
                    return l - r;
                case '*':
                    return l * r;
                case '/':
                    if (r === 0) throw new Error('Division by zero');
                    return l / r;
                case '%':
                    if (r === 0) throw new Error('Division by zero');
                    return l % r;
                case '^':
                    return Math.pow(l, r);
                default:
                    throw new Error(`Unknown operator: '${node.op}'`);
            }
        }

        case 'call': {
            const args = node.args.map(evalNode);
            switch (node.name) {
                case 'sqrt':
                    return Math.sqrt(args[0]!);
                case 'abs':
                    return Math.abs(args[0]!);
                case 'ceil':
                    return Math.ceil(args[0]!);
                case 'floor':
                    return Math.floor(args[0]!);
                case 'round':
                    return Math.round(args[0]!);
                case 'sin':
                    return Math.sin(args[0]!);
                case 'cos':
                    return Math.cos(args[0]!);
                case 'tan':
                    return Math.tan(args[0]!);
                case 'log':
                    return Math.log(args[0]!);
                case 'log2':
                    return Math.log2(args[0]!);
                case 'log10':
                    return Math.log10(args[0]!);
                case 'exp':
                    return Math.exp(args[0]!);
                case 'min':
                    if (args.length !== 2) throw new Error('min() requires exactly 2 arguments');
                    return Math.min(args[0]!, args[1]!);
                case 'max':
                    if (args.length !== 2) throw new Error('max() requires exactly 2 arguments');
                    return Math.max(args[0]!, args[1]!);
                default:
                    throw new Error(`Unknown function: '${node.name}'`);
            }
        }
    }
}

/**
 * Evaluates a mathematical expression string and returns the result.
 *
 * @param expr - Math expression; supports +, -, *, /, %, ^, unary -, parentheses, constants (pi, e) and functions (sin, cos, tan, sqrt, abs, ceil, floor, round, log, log2, log10, exp, min, max)
 * @param precision - Number of decimal places in the result (0–15, default 10)
 * @returns Object with the original expression, numeric result, and applied precision
 * @throws Error if the expression is empty, exceeds the maximum length, contains unknown identifiers, or produces a non-finite result
 */
export default function evaluate(expr: string, precision?: number): EvaluateResult {
    if (!expr || typeof expr !== 'string' || expr.trim() === '') {
        throw new Error('Please provide a math expression');
    }
    if (expr.length > MAX_EXPR_LENGTH) {
        throw new Error(`Expression cannot exceed ${MAX_EXPR_LENGTH} characters`);
    }

    const prec = Math.min(15, Math.max(0, precision !== undefined ? Math.floor(precision) : 10));

    const tokens = tokenize(expr.trim());
    if (tokens.length === 0) throw new Error('Please provide a math expression');

    const parser = new Parser(tokens);
    const ast = parser.run();

    const raw = evalNode(ast);

    if (!isFinite(raw)) throw new Error('Result is not finite (overflow or undefined operation)');

    const result = Number(raw.toFixed(prec));

    return { expression: expr, result, precision: prec };
}
