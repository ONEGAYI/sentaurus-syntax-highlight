// src/lsp/providers/tcl-document-symbol-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * 创建 VSCode DocumentSymbolProvider for Tcl-based Sentaurus languages.
 * 使用 TclParseCache 管理解析缓存，Provider 不再自行调用 parseSafe / tree.delete。
 * @param {import('../parse-cache').TclParseCache} tclCache
 * @returns {object}
 */
function createTclDocumentSymbolProvider(tclCache) {
    return {
        /**
         * @param {vscode.TextDocument} document
         * @returns {vscode.DocumentSymbol[]}
         */
        provideDocumentSymbols(document) {
            const entry = tclCache.get(document);
            if (!entry) return [];

            const rawSymbols = astUtils.getDocumentSymbols(entry.tree.rootNode, document.languageId);
            return rawSymbols.map(s => toVscodeSymbol(s, document));
        },
    };
}

/**
 * 将原始 symbol 转换为 vscode.DocumentSymbol。
 * @param {object} raw - getDocumentSymbols 返回的 symbol 对象
 * @param {vscode.TextDocument} document
 * @returns {vscode.DocumentSymbol}
 */
function toVscodeSymbol(raw, document) {
    const range = new vscode.Range(
        raw.startLine, 0,
        raw.endLine, document.lineAt(raw.endLine).text.length
    );
    const children = (raw.children || []).map(c => toVscodeSymbol(c, document));
    return new vscode.DocumentSymbol(raw.name, '', raw.kind, range, range);
}

module.exports = { createTclDocumentSymbolProvider };
