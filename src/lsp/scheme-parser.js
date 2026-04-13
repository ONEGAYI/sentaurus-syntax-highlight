// src/lsp/scheme-parser.js
'use strict';

const TokenType = {
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    SYMBOL: 'SYMBOL',
    QUOTE: 'QUOTE',
    COMMENT: 'COMMENT',
    EOF: 'EOF',
};

function tokenize(text) {
    const tokens = [];
    let i = 0;
    let line = 1;

    while (i < text.length) {
        const ch = text[i];

        if (ch === '\n') { line++; i++; continue; }
        if (/\s/.test(ch)) { i++; continue; }

        if (ch === ';') {
            const start = i;
            while (i < text.length && text[i] !== '\n') i++;
            tokens.push({ type: TokenType.COMMENT, value: text.slice(start + 1, i), start, end: i, line });
            continue;
        }

        if (ch === "'") {
            tokens.push({ type: TokenType.QUOTE, value: "'", start: i, end: i + 1, line });
            i++;
            continue;
        }

        if (ch === '(') {
            tokens.push({ type: TokenType.LPAREN, value: '(', start: i, end: i + 1, line });
            i++;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: TokenType.RPAREN, value: ')', start: i, end: i + 1, line });
            i++;
            continue;
        }

        if (ch === '"') {
            const start = i;
            i++;
            let value = '';
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\' && i + 1 < text.length) {
                    const next = text[i + 1];
                    if (next === '"') { value += '"'; i += 2; continue; }
                    if (next === 'n') { value += '\n'; i += 2; continue; }
                    if (next === 't') { value += '\t'; i += 2; continue; }
                    if (next === '\\') { value += '\\'; i += 2; continue; }
                }
                if (text[i] === '\n') line++;
                value += text[i];
                i++;
            }
            i++;
            tokens.push({ type: TokenType.STRING, value, start, end: i, line });
            continue;
        }

        if (ch === '#' && i + 1 < text.length && (text[i + 1] === 't' || text[i + 1] === 'f')) {
            const val = text[i + 1] === 't';
            tokens.push({ type: TokenType.BOOLEAN, value: val, start: i, end: i + 2, line });
            i += 2;
            continue;
        }

        const start = i;
        while (i < text.length && !/[\s()";]/.test(text[i])) i++;
        const raw = text.slice(start, i);

        if (/^-?\d/.test(raw) && !isNaN(Number(raw))) {
            tokens.push({ type: TokenType.NUMBER, value: Number(raw), start, end: i, line });
        } else {
            tokens.push({ type: TokenType.SYMBOL, value: raw, start, end: i, line });
        }
    }

    tokens.push({ type: TokenType.EOF, value: null, start: i, end: i, line });
    return tokens;
}

/**
 * Parse source text into AST with error tolerance.
 * @param {string} text Source code text
 * @returns {{ ast: object, errors: object[] }}
 */
function parse(text) {
    const tokens = tokenize(text);
    const errors = [];
    let pos = 0;

    function current() { return tokens[pos]; }
    function advance() { return tokens[pos++]; }

    function countLinesUpTo(offset) {
        let count = 1;
        for (let j = 0; j < offset; j++) {
            if (text[j] === '\n') count++;
        }
        return count;
    }

    function parseExpr() {
        const tok = current();

        if (tok.type === TokenType.EOF) {
            return null;
        }

        if (tok.type === TokenType.QUOTE) {
            advance();
            const expr = parseExpr();
            return {
                type: 'Quote',
                expression: expr,
                start: tok.start,
                end: expr.end,
                line: tok.line,
                endLine: expr.endLine,
            };
        }

        if (tok.type === TokenType.LPAREN) {
            return parseList();
        }

        if (tok.type === TokenType.COMMENT) {
            advance();
            return {
                type: 'Comment',
                value: tok.value,
                start: tok.start,
                end: tok.end,
                line: tok.line,
                endLine: tok.line,
            };
        }

        if (tok.type === TokenType.RPAREN) {
            errors.push({
                message: '多余的闭括号',
                start: tok.start,
                end: tok.end,
                line: tok.line,
                severity: 'warning',
            });
            advance();
            return parseExpr();
        }

        advance();
        if (tok.type === TokenType.NUMBER) {
            return { type: 'Number', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.STRING) {
            return { type: 'String', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.BOOLEAN) {
            return { type: 'Boolean', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.SYMBOL) {
            return { type: 'Identifier', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }

        return { type: 'Identifier', value: '', start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
    }

    function parseList() {
        const openTok = advance();
        const children = [];
        let endLine = openTok.line;

        while (current().type !== TokenType.RPAREN && current().type !== TokenType.EOF) {
            const child = parseExpr();
            if (!child) break;
            children.push(child);
            endLine = child.endLine;
        }

        if (current().type === TokenType.RPAREN) {
            const closeTok = advance();
            endLine = closeTok.line;
            return {
                type: 'List',
                children,
                start: openTok.start,
                end: closeTok.end,
                line: openTok.line,
                endLine,
                text: text.slice(openTok.start, closeTok.end),
            };
        }

        errors.push({
            message: `未闭合的括号（在第 ${openTok.line} 行打开）`,
            start: openTok.start,
            end: text.length,
            line: openTok.line,
            severity: 'error',
        });

        return {
            type: 'List',
            children,
            start: openTok.start,
            end: text.length,
            line: openTok.line,
            endLine,
            text: text.slice(openTok.start),
        };
    }

    const body = [];
    while (current().type !== TokenType.EOF) {
        const node = parseExpr();
        if (node) body.push(node);
    }

    const ast = {
        type: 'Program',
        body,
        start: 0,
        end: text.length,
        line: 1,
        endLine: countLinesUpTo(text.length),
    };

    return { ast, errors };
}

module.exports = { tokenize, parse, TokenType };
