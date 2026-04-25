// src/commands/expression-converter.js
'use strict';

const schemeParser = require('../lsp/scheme-parser');

// ────────────────────────────────────────────
// 运算符 / 函数分类定义
// ────────────────────────────────────────────

const ARITHMETIC_OPS = {
    '+': { infix: '+', precedence: 1, multiArg: true },
    '-': { infix: '-', precedence: 1, multiArg: false },
    '*': { infix: '*', precedence: 2, multiArg: true },
    '/': { infix: '/', precedence: 2, multiArg: false },
};

const SPECIAL_OPS = {
    'expt':      { infix: '^',  precedence: 3 },
    'modulo':    { infix: '%',  precedence: 2 },
    'remainder': { infix: '%%', precedence: 2 },
    'quotient':  { infix: '//', precedence: 2 },
};

const MATH_FUNCTIONS = {
    'sin':    { infixName: 'sin' },
    'cos':    { infixName: 'cos' },
    'tan':    { infixName: 'tan' },
    'asin':   { infixName: 'asin' },
    'acos':   { infixName: 'acos' },
    'atan':   { infixName: 'atan' },
    'sqrt':   { infixName: 'sqrt' },
    'abs':    { infixName: 'abs' },
    'exp':    { infixName: 'exp' },
    'log':    { infixName: 'log' },
    'floor':  { infixName: 'floor' },
    'ceiling':{ infixName: 'ceil' },
    'round':  { infixName: 'round' },
    'min':    { infixName: 'min' },
    'max':    { infixName: 'max' },
};

const INFIX_TO_PREFIX = {};
for (const [scheme, cfg] of Object.entries(ARITHMETIC_OPS)) {
    INFIX_TO_PREFIX[cfg.infix] = { scheme, precedence: cfg.precedence, multiArg: cfg.multiArg };
}
for (const [scheme, cfg] of Object.entries(SPECIAL_OPS)) {
    INFIX_TO_PREFIX[cfg.infix] = { scheme, precedence: cfg.precedence };
}
for (const [scheme, cfg] of Object.entries(MATH_FUNCTIONS)) {
    INFIX_TO_PREFIX[cfg.infixName] = { scheme, isFunction: true };
}
INFIX_TO_PREFIX['**'] = INFIX_TO_PREFIX['^'];

// ────────────────────────────────────────────
// prefixToInfix: Scheme 前缀 → 中缀/函数调用
// ────────────────────────────────────────────

function getNodePrecedence(node) {
    if (node.type !== 'List' || !node.children || node.children.length === 0) return Infinity;
    const op = node.children[0];
    if (op.type !== 'Identifier') return Infinity;
    const name = op.value;
    if (ARITHMETIC_OPS[name]) return ARITHMETIC_OPS[name].precedence;
    if (SPECIAL_OPS[name]) return SPECIAL_OPS[name].precedence;
    return Infinity;
}

function astToInfix(node, parentPrecedence = 0) {
    if (node.type === 'Number') return String(node.value);
    if (node.type === 'Identifier') return node.value;
    if (node.type === 'Boolean') return node.value ? '#t' : '#f';
    if (node.type === 'String') return `"${node.value}"`;

    if (node.type !== 'List' || !node.children || node.children.length === 0) {
        return node.text || node.value || '';
    }

    const first = node.children[0];
    if (first.type !== 'Identifier') {
        return node.text || '';
    }
    const opName = first.value;
    const args = node.children.slice(1);

    if (ARITHMETIC_OPS[opName]) {
        const cfg = ARITHMETIC_OPS[opName];

        if (opName === '-' && args.length === 1) {
            const inner = astToInfix(args[0], cfg.precedence);
            return `-${inner}`;
        }

        if (opName === '+' && args.length === 1) {
            return astToInfix(args[0], parentPrecedence);
        }

        const parts = args.map(a => astToInfix(a, cfg.precedence));
        let result = parts.join(` ${cfg.infix} `);

        if (cfg.precedence < parentPrecedence) {
            result = `(${result})`;
        }
        return result;
    }

    if (SPECIAL_OPS[opName]) {
        const cfg = SPECIAL_OPS[opName];
        if (args.length < 2) return node.text || '';

        const left = astToInfix(args[0], cfg.precedence);
        const right = astToInfix(args[1], cfg.precedence + 1);
        let result = `${left} ${cfg.infix} ${right}`;

        if (cfg.precedence < parentPrecedence) {
            result = `(${result})`;
        }
        return result;
    }

    if (MATH_FUNCTIONS[opName]) {
        const cfg = MATH_FUNCTIONS[opName];
        const infixArgs = args.map(a => astToInfix(a));
        return `${cfg.infixName}(${infixArgs.join(', ')})`;
    }

    return node.text || '';
}

function prefixToInfix(text) {
    text = text.trim();
    if (!text) return { error: '空输入' };

    const { ast, errors } = schemeParser.parse(text);
    if (errors.length > 0) {
        return { error: errors.map(e => e.message).join('; ') };
    }

    if (!ast.body || ast.body.length === 0) {
        return { error: '未找到表达式' };
    }

    const result = astToInfix(ast.body[0]);
    return { result };
}

// ────────────────────────────────────────────
// infixToPrefix: 中缀/函数调用 → Scheme 前缀
// ────────────────────────────────────────────

const INFIX_TOKEN_TYPE = {
    NUMBER: 'NUMBER',
    IDENT:  'IDENT',
    OP:     'OP',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    COMMA:  'COMMA',
    EOF:    'EOF',
};

function tokenizeInfix(text) {
    const tokens = [];
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        if (/\s/.test(ch)) { i++; continue; }

        if (ch === '(') { tokens.push({ type: INFIX_TOKEN_TYPE.LPAREN, value: '(' }); i++; continue; }
        if (ch === ')') { tokens.push({ type: INFIX_TOKEN_TYPE.RPAREN, value: ')' }); i++; continue; }
        if (ch === ',') { tokens.push({ type: INFIX_TOKEN_TYPE.COMMA, value: ',' }); i++; continue; }

        // 多字符运算符
        if (i + 1 < text.length) {
            const two = text.slice(i, i + 2);
            if (two === '%%' || two === '//' || two === '**') {
                const mapped = two === '**' ? '^' : two;
                tokens.push({ type: INFIX_TOKEN_TYPE.OP, value: mapped });
                i += 2;
                continue;
            }
        }

        // 尖括号变量 <var-name>：连字符标识符在中缀表达式中的消歧语法
        if (ch === '<') {
            const contentStart = i + 1;
            let j = contentStart;
            let foundClose = false;
            while (j < text.length) {
                if (text[j] === '>') { foundClose = true; break; }
                if (text[j] === '<') throw new Error(`嵌套尖括号（位置 ${i}）`);
                j++;
            }
            if (!foundClose) throw new Error(`未闭合的尖括号（位置 ${i}）`);
            const content = text.slice(contentStart, j);
            if (content.length === 0) throw new Error(`空尖括号（位置 ${i}）`);
            tokens.push({ type: INFIX_TOKEN_TYPE.IDENT, value: content });
            i = j + 1;
            continue;
        }

        if ('+-*/%^'.includes(ch)) {
            tokens.push({ type: INFIX_TOKEN_TYPE.OP, value: ch });
            i++;
            continue;
        }

        if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < text.length && /[0-9]/.test(text[i + 1]))) {
            const start = i;
            while (i < text.length && /[0-9.]/.test(text[i])) i++;
            tokens.push({ type: INFIX_TOKEN_TYPE.NUMBER, value: text.slice(start, i) });
            continue;
        }

        if (/[a-zA-Z_@]/.test(ch)) {
            const start = i;
            while (i < text.length && /[a-zA-Z0-9_@]/.test(text[i])) i++;
            tokens.push({ type: INFIX_TOKEN_TYPE.IDENT, value: text.slice(start, i) });
            continue;
        }

        i++;
    }

    tokens.push({ type: INFIX_TOKEN_TYPE.EOF, value: null });
    return tokens;
}

function parseInfix(tokens) {
    let pos = 0;

    function current() { return tokens[pos]; }
    function advance() { return tokens[pos++]; }

    function expect(type, value) {
        const tok = advance();
        if (tok.type !== type || (value !== undefined && tok.value !== value)) {
            throw new Error(`期望 ${value || type}，得到 ${tok.value || tok.type}（位置 ${pos}）`);
        }
        return tok;
    }

    function parseExpression() {
        let left = parseTerm();
        while (current().type === INFIX_TOKEN_TYPE.OP &&
               (current().value === '+' || current().value === '-')) {
            const op = advance().value;
            const right = parseTerm();
            left = { type: 'binary', op, left, right };
        }
        return left;
    }

    function parseTerm() {
        let left = parsePower();
        while (current().type === INFIX_TOKEN_TYPE.OP &&
               ['*', '/', '%', '%%', '//'].includes(current().value)) {
            const op = advance().value;
            const right = parsePower();
            left = { type: 'binary', op, left, right };
        }
        return left;
    }

    function parsePower() {
        let base = parseUnary();
        if (current().type === INFIX_TOKEN_TYPE.OP && current().value === '^') {
            advance();
            const exp = parsePower();
            return { type: 'binary', op: '^', left: base, right: exp };
        }
        return base;
    }

    function parseUnary() {
        if (current().type === INFIX_TOKEN_TYPE.OP && current().value === '-') {
            advance();
            const operand = parseUnary();
            return { type: 'unary', op: '-', operand };
        }
        return parseCall();
    }

    function parseCall() {
        if (current().type === INFIX_TOKEN_TYPE.IDENT &&
            pos + 1 < tokens.length &&
            tokens[pos + 1].type === INFIX_TOKEN_TYPE.LPAREN) {
            const name = advance().value;
            advance();
            const args = [];
            if (current().type !== INFIX_TOKEN_TYPE.RPAREN) {
                args.push(parseExpression());
                while (current().type === INFIX_TOKEN_TYPE.COMMA) {
                    advance();
                    args.push(parseExpression());
                }
            }
            expect(INFIX_TOKEN_TYPE.RPAREN);
            return { type: 'call', name, args };
        }
        return parseAtom();
    }

    function parseAtom() {
        const tok = current();
        if (tok.type === INFIX_TOKEN_TYPE.NUMBER) {
            advance();
            return { type: 'number', value: tok.value };
        }
        if (tok.type === INFIX_TOKEN_TYPE.IDENT) {
            advance();
            return { type: 'ident', value: tok.value };
        }
        if (tok.type === INFIX_TOKEN_TYPE.LPAREN) {
            advance();
            const expr = parseExpression();
            expect(INFIX_TOKEN_TYPE.RPAREN);
            return expr;
        }
        throw new Error(`意外的 token: ${tok.value || tok.type}（位置 ${pos}）`);
    }

    const ast = parseExpression();
    if (current().type !== INFIX_TOKEN_TYPE.EOF) {
        throw new Error(`多余的输入: ${current().value}（位置 ${pos}）`);
    }
    return ast;
}


// Recursively collect all operands from a left-associative chain of same-operator binary nodes.
// e.g. (+ (+ a b) c) → [a, b, c]  with op='+'
function collectOperands(node, op) {
    if (node.type === 'binary' && node.op === op) {
        return [...collectOperands(node.left, op), ...collectOperands(node.right, op)];
    }
    return [node];
}

function astToPrefix(node) {
    if (node.type === 'number') return node.value;
    if (node.type === 'ident') return node.value;

    if (node.type === 'unary') {
        if (node.op === '-') {
            const inner = astToPrefix(node.operand);
            if (node.operand.type === 'number') return `-${inner}`;
            return `(- ${inner})`;
        }
    }

    if (node.type === 'binary') {
        const mapping = INFIX_TO_PREFIX[node.op];
        const schemeOp = mapping ? mapping.scheme : node.op;
        // Flatten same-operator chains: a + b + c → (+ a b c)
        const operands = collectOperands(node, node.op);
        const parts = operands.map(o => astToPrefix(o));
        return `(${schemeOp} ${parts.join(' ')})`;
    }

    if (node.type === 'call') {
        const mapping = INFIX_TO_PREFIX[node.name];
        const schemeName = mapping ? mapping.scheme : node.name;
        const args = node.args.map(a => astToPrefix(a)).join(' ');
        return `(${schemeName} ${args})`;
    }

    return String(node.value || '');
}

function infixToPrefix(text) {
    text = text.trim();
    if (!text) return { error: '空输入' };

    if (text.startsWith('(') && text.endsWith(')')) {
        let depth = 0;
        let isWrapped = true;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') depth++;
            if (text[i] === ')') depth--;
            if (depth === 0 && i < text.length - 1) { isWrapped = false; break; }
        }
        if (isWrapped) text = text.slice(1, -1).trim();
    }

    try {
        const tokens = tokenizeInfix(text);
        const ast = parseInfix(tokens);
        const result = astToPrefix(ast);
        return { result };
    } catch (e) {
        return { error: e.message };
    }
}

function getSupportedOperators() {
    return [
        {
            category: '算术运算符',
            items: [
                { scheme: '+', infix: '+', description: '加法（支持多参数）', example_scheme: '(+ a b c)', example_infix: 'a + b + c' },
                { scheme: '-', infix: '-', description: '减法 / 取负', example_scheme: '(- a b)', example_infix: 'a - b' },
                { scheme: '*', infix: '*', description: '乘法（支持多参数）', example_scheme: '(* a b c)', example_infix: 'a * b * c' },
                { scheme: '/', infix: '/', description: '除法', example_scheme: '(/ a b)', example_infix: 'a / b' },
            ],
        },
        {
            category: '特殊运算符',
            items: [
                { scheme: 'expt', infix: '^ 或 **', description: '幂运算', example_scheme: '(expt a b)', example_infix: 'a ^ b' },
                { scheme: 'modulo', infix: '%', description: '取模（结果符号与除数相同）', example_scheme: '(modulo a b)', example_infix: 'a % b' },
                { scheme: 'remainder', infix: '%%', description: '取余（结果符号与被除数相同）', example_scheme: '(remainder a b)', example_infix: 'a %% b' },
                { scheme: 'quotient', infix: '//', description: '取整商', example_scheme: '(quotient a b)', example_infix: 'a // b' },
            ],
        },
        {
            category: '数学函数',
            items: [
                { scheme: 'sin', infix: 'sin()', description: '正弦（弧度）', example_scheme: '(sin x)', example_infix: 'sin(x)' },
                { scheme: 'cos', infix: 'cos()', description: '余弦（弧度）', example_scheme: '(cos x)', example_infix: 'cos(x)' },
                { scheme: 'tan', infix: 'tan()', description: '正切（弧度）', example_scheme: '(tan x)', example_infix: 'tan(x)' },
                { scheme: 'asin', infix: 'asin()', description: '反正弦', example_scheme: '(asin x)', example_infix: 'asin(x)' },
                { scheme: 'acos', infix: 'acos()', description: '反余弦', example_scheme: '(acos x)', example_infix: 'acos(x)' },
                { scheme: 'atan', infix: 'atan()', description: '反正切（1~2 个参数）', example_scheme: '(atan y x)', example_infix: 'atan(y, x)' },
                { scheme: 'sqrt', infix: 'sqrt()', description: '平方根', example_scheme: '(sqrt x)', example_infix: 'sqrt(x)' },
                { scheme: 'abs', infix: 'abs()', description: '绝对值', example_scheme: '(abs x)', example_infix: 'abs(x)' },
                { scheme: 'exp', infix: 'exp()', description: '指数函数 e^x', example_scheme: '(exp x)', example_infix: 'exp(x)' },
                { scheme: 'log', infix: 'log()', description: '自然对数', example_scheme: '(log x)', example_infix: 'log(x)' },
            ],
        },
        {
            category: '取整函数',
            items: [
                { scheme: 'floor', infix: 'floor()', description: '向下取整', example_scheme: '(floor x)', example_infix: 'floor(x)' },
                { scheme: 'ceiling', infix: 'ceil()', description: '向上取整', example_scheme: '(ceiling x)', example_infix: 'ceil(x)' },
                { scheme: 'round', infix: 'round()', description: '四舍五入', example_scheme: '(round x)', example_infix: 'round(x)' },
            ],
        },
        {
            category: '聚合函数',
            items: [
                { scheme: 'min', infix: 'min()', description: '最小值（支持多参数）', example_scheme: '(min a b c)', example_infix: 'min(a, b, c)' },
                { scheme: 'max', infix: 'max()', description: '最大值（支持多参数）', example_scheme: '(max a b c)', example_infix: 'max(a, b, c)' },
            ],
        },
    ];
}

// ────────────────────────────────────────────
// QuickPick 辅助函数（变量补全 + 历史模式）
// ────────────────────────────────────────────

class CursorTracker {
    constructor() {
        this._prevValue = '';
    }

    update(newValue) {
        const cursor = this._inferCursor(this._prevValue, newValue);
        this._prevValue = newValue;
        return cursor;
    }

    sync(value) {
        this._prevValue = value;
    }

    reset() {
        this._prevValue = '';
    }

    // 公共前缀+后缀启发式推断，对称编辑可能偏移 1，足够 QuickPick 词定位
    _inferCursor(oldVal, newVal) {
        if (oldVal === newVal) return newVal.length;

        let prefixLen = 0;
        const minLen = Math.min(oldVal.length, newVal.length);
        while (prefixLen < minLen && oldVal[prefixLen] === newVal[prefixLen]) {
            prefixLen++;
        }

        const oldRem = oldVal.length - prefixLen;
        const newRem = newVal.length - prefixLen;
        let suffixLen = 0;
        while (suffixLen < oldRem && suffixLen < newRem &&
               oldVal[oldVal.length - 1 - suffixLen] === newVal[newVal.length - 1 - suffixLen]) {
            suffixLen++;
        }

        return newVal.length - suffixLen;
    }
}

const IDENT_CHAR_RE = /[a-zA-Z0-9_@]/;

function getWordAtPosition(value, cursorPos) {
    if (cursorPos < 0 || cursorPos > value.length) return null;
    let start = cursorPos;
    while (start > 0 && IDENT_CHAR_RE.test(value[start - 1])) start--;

    let end = cursorPos;
    while (end < value.length && IDENT_CHAR_RE.test(value[end])) end++;

    if (start === end) return null;

    return { prefix: value.slice(start, cursorPos), start, end };
}

function replaceWordAtPosition(value, wordInfo, replacement) {
    return value.slice(0, wordInfo.start) + replacement + value.slice(wordInfo.end);
}

function parseHistoryInput(value) {
    if (!value.startsWith('!')) return null;
    const rest = value.slice(1);
    if (rest === '') return { mode: 'history', index: null, filter: '' };
    // "!3" → 精确序号（纯数字）
    const numMatch = rest.match(/^(\d+)$/);
    if (numMatch) return { mode: 'history', index: parseInt(numMatch[1], 10), filter: '' };
    // "! text" 或 "!abc" → 模糊过滤
    const filter = rest.startsWith(' ') ? rest.slice(1) : rest;
    return { mode: 'history', index: null, filter };
}

module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators,
    CursorTracker,
    getWordAtPosition,
    replaceWordAtPosition,
    parseHistoryInput,
};
