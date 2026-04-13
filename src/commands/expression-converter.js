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

function infixToPrefix(text) {
    return { error: '尚未实现' };
}

function getSupportedOperators() {
    return {};
}

module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators,
};
