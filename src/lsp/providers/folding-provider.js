// src/lsp/providers/folding-provider.js
'use strict';

const vscode = require('vscode');
const { parse } = require('../scheme-parser');
const { analyze } = require('../scheme-analyzer');

/**
 * VSCode FoldingRangeProvider for SDE (Scheme).
 */
const foldingProvider = {
    provideFoldingRanges(document) {
        const text = document.getText();
        const { ast } = parse(text);
        const { foldingRanges } = analyze(ast);

        return foldingRanges.map(range => new vscode.FoldingRange(
            range.startLine,
            range.endLine
        ));
    },
};

module.exports = foldingProvider;
