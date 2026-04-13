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

module.exports = { tokenize };
