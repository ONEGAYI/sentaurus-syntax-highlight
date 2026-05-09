// src/lsp/providers/symbol-reference-provider.js
'use strict';

const { safeCol } = require('../pp-utils');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let vscode;

function activate(context, schemeCacheInstance, vscodeRef) {
    schemeCache = schemeCacheInstance;
    vscode = vscodeRef;

    const provider = {
        provideReferences(document, position, options) {
            return provideSymbolReferences(document, position, options);
        },
    };
    const disposable = vscode.languages.registerReferenceProvider(
        { language: 'sde' },
        provider
    );
    context.subscriptions.push(disposable);
}

/**
 * 查找光标下符号的所有定义和引用位置。
 * @param {object} document - vscode.TextDocument
 * @param {object} position - vscode.Position
 * @param {object} options - { includeDeclaration: boolean }
 * @returns {vscode.Location[]|null}
 */
function provideSymbolReferences(document, position, options) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, text, lineStarts } = entry;

    // 从光标位置提取可能的符号名（引号内字符串）
    const range = document.getWordRangeAtPosition(position, /"[^"]*"/);
    if (!range) return null;

    const quotedText = document.getText(range);
    const targetName = quotedText.slice(1, -1); // 去掉引号
    if (!targetName) return null;

    const { defs, refs } = schemeCache.getSymbols(document) || { defs: [], refs: [] };
    const all = [...defs, ...refs];
    const matches = all.filter(e => e.name === targetName);

    if (matches.length === 0) return null;

    const locations = [];
    for (const m of matches) {
        // m.start/m.end 是文档级偏移量，需转为行内列号
        const startCol = safeCol(lineStarts, m.line, m.start);
        const endCol = safeCol(lineStarts, m.line, m.end);
        const loc = new vscode.Location(
            document.uri,
            new vscode.Range(m.line - 1, startCol, m.line - 1, endCol)
        );
        locations.push(loc);
    }
    return locations;
}

module.exports = { activate, provideSymbolReferences };
