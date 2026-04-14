// src/lsp/providers/tcl-folding-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode FoldingRangeProvider for Tcl-based Sentaurus languages.
 * 共用于 sdevice, sprocess, emw, inspect 四种语言。
 */
const tclFoldingProvider = {
    /**
     * @param {vscode.TextDocument} document
     * @returns {vscode.FoldingRange[]}
     */
    provideFoldingRanges(document) {
        const text = document.getText();
        const tree = astUtils.parseSafe(text);
        if (!tree) return [];

        try {
            const ranges = astUtils.getFoldingRanges(tree.rootNode);
            return ranges.map(r => new vscode.FoldingRange(r.startLine, r.endLine));
        } finally {
            tree.delete();
        }
    },
};

module.exports = tclFoldingProvider;
