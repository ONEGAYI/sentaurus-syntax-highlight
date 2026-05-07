// src/lsp/providers/folding-provider.js
'use strict';

const vscode = require('vscode');
const ppUtils = require('../pp-utils');

/**
 * Create a FoldingRangeProvider backed by the shared Scheme parse cache.
 * @param {import('../parse-cache').SchemeParseCache} schemeCache
 */
function createFoldingProvider(schemeCache) {
    return {
        provideFoldingRanges(document) {
            const { analysis } = schemeCache.get(document);
            const ranges = analysis.foldingRanges.map(range => new vscode.FoldingRange(
                range.startLine,
                range.endLine
            ));
            const ppBlocks = ppUtils.buildPpBlocks(document.getText());
            for (const pr of ppBlocks.foldingRanges) {
                ranges.push(new vscode.FoldingRange(pr.startLine, pr.endLine));
            }
            return ranges;
        },
    };
}

module.exports = { createFoldingProvider };
