// src/lsp/providers/symbol-reference-provider.js
'use strict';

const { extractSymbols } = require('../symbol-index');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {object} */
let vscode;

/**
 * 注册 Find All References Provider（SDE only）。
 * @param {object} context - vscode.ExtensionContext
 * @param {import('../parse-cache').SchemeParseCache} schemeCacheInstance
 * @param {object} symbolParams - 函数名 → { symbolParams: [...] } 映射表
 * @param {object} modeDispatch - 函数名 → modeDispatch 元数据
 * @param {object} vscodeRef - vscode 模块引用
 */
function activate(context, schemeCacheInstance, symbolParams, modeDispatch, vscodeRef) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;
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

    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const all = [...defs, ...refs];
    const matches = all.filter(e => e.name === targetName);

    if (matches.length === 0) return null;

    const locations = [];
    for (const m of matches) {
        // m.start/m.end 是文档级偏移量，需转为行内列号
        const startCol = m.start - lineStarts[m.line - 1];
        const endCol = m.end - lineStarts[m.line - 1];
        const loc = new vscode.Location(
            document.uri,
            new vscode.Range(m.line - 1, startCol, m.line - 1, endCol)
        );
        locations.push(loc);
    }
    return locations;
}

module.exports = { activate, provideSymbolReferences };
