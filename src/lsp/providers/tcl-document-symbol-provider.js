// src/lsp/providers/tcl-document-symbol-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode DocumentSymbolProvider for Tcl-based Sentaurus languages.
 * 为 sdevice, sprocess, emw, inspect 提供面包屑导航和 Outline 视图。
 */
const tclDocumentSymbolProvider = {
    /**
     * @param {vscode.TextDocument} document
     * @returns {vscode.DocumentSymbol[]}
     */
    provideDocumentSymbols(document) {
        const text = document.getText();
        const tree = astUtils.parseSafe(text);
        if (!tree) return [];

        try {
            const rawSymbols = astUtils.getDocumentSymbols(tree.rootNode, document.languageId);
            return rawSymbols.map(s => toVscodeSymbol(s, document));
        } finally {
            tree.delete();
        }
    },
};

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

module.exports = tclDocumentSymbolProvider;
